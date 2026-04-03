import { Redis } from '@upstash/redis'
import { Realtime, handle } from '@upstash/realtime'
import { createClerkClient } from '@clerk/backend'
import { seatingRealtimeSchema } from '../shared/realtimeSchema'
import { clerkUserEmailAddresses, requireUser, resolveClerkPublishableKey } from './auth'
import {
  acceptProjectInvite,
  canAccessProject,
  createProject,
  createProjectInvite,
  getProject,
  isOwner,
  listProjects,
  PROJECT_INVITE_TTL_SECONDS,
  renameProject,
  saveProjectState,
} from './projects'
import { parseWeddingState } from '../src/state/weddingStateCodec'
import type { ExportedHandler } from '@cloudflare/workers-types'

export interface Env {
  UPSTASH_REDIS_REST_URL: string
  UPSTASH_REDIS_REST_TOKEN: string
  CLERK_SECRET_KEY: string
  /** Prefer this in production (Wrangler vars / dashboard). */
  CLERK_PUBLISHABLE_KEY?: string
  /** Same key as the Vite client; loaded from `.env` in local dev when `CLERK_PUBLISHABLE_KEY` is unset. */
  VITE_CLERK_PUBLISHABLE_KEY?: string
}

function redisClient(env: Env): Redis {
  return new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  })
}

function clerkClient(env: Env) {
  return createClerkClient({
    secretKey: env.CLERK_SECRET_KEY,
    publishableKey: resolveClerkPublishableKey(env),
  })
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function handleRealtime(request: Request, env: Env): Promise<Response> {
  const redis = redisClient(env)
  const realtime = new Realtime({ schema: seatingRealtimeSchema, redis })
  const clerk = clerkClient(env)
  const handler = handle({
    realtime,
    middleware: async ({ request: req, channels }) => {
      const user = await requireUser(req, clerk, env)
      if (user instanceof Response) return user
      for (const ch of channels) {
        if (!ch.startsWith('project:')) {
          return new Response(JSON.stringify({ error: 'Invalid channel' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        const projectId = ch.slice('project:'.length)
        const ok = await canAccessProject(redis, user.userId, projectId)
        if (!ok) {
          return new Response(JSON.stringify({ error: 'Forbidden' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      }
      return undefined
    },
  })
  const out = await handler(request)
  if (!out) {
    return new Response('Internal Server Error', { status: 500 })
  }
  return out
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname

    if (path === '/api/realtime') {
      return handleRealtime(request, env)
    }

    if (!path.startsWith('/api/')) {
      return new Response('Not Found', { status: 404 })
    }

    const redis = redisClient(env)
    const clerk = clerkClient(env)

    const user = await requireUser(request, clerk, env)
    if (user instanceof Response) {
      return user
    }

    if (path === '/api/projects' && request.method === 'GET') {
      const list = await listProjects(redis, user.userId)
      return json({ projects: list })
    }

    if (path === '/api/projects' && request.method === 'POST') {
      let body: { name?: string } = {}
      try {
        body = (await request.json()) as { name?: string }
      } catch {
        body = {}
      }
      const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : 'Untitled'
      const meta = await createProject(redis, user.userId, name)
      return json({ project: meta })
    }

    if (path === '/api/invites/accept' && request.method === 'POST') {
      let body: { token?: string } = {}
      try {
        body = (await request.json()) as { token?: string }
      } catch {
        return json({ error: 'Invalid JSON' }, 400)
      }
      const token = typeof body.token === 'string' ? body.token.trim() : ''
      if (!token) return json({ error: 'token required' }, 400)
      const emails = await clerkUserEmailAddresses(clerk, user.userId)
      const meta = await acceptProjectInvite(redis, user.userId, token, emails)
      if (!meta) {
        return json(
          { error: 'Invalid or expired invite, or your account email does not match the invitation' },
          400,
        )
      }
      return json({ project: meta })
    }

    const inviteMatch = /^\/api\/projects\/([^/]+)\/invites$/.exec(path)
    if (inviteMatch && request.method === 'POST') {
      const projectId = inviteMatch[1]!
      let body: { email?: string } = {}
      try {
        body = (await request.json()) as { email?: string }
      } catch {
        body = {}
      }
      const email = typeof body.email === 'string' ? body.email : ''
      const created = await createProjectInvite(redis, user.userId, projectId, email)
      if (!created) {
        return json({ error: 'Only the owner can invite, or the email is invalid' }, 400)
      }
      return json({
        invite: { token: created.token, expiresInSeconds: PROJECT_INVITE_TTL_SECONDS },
      })
    }

    const projectMatch = /^\/api\/projects\/([^/]+)$/.exec(path)
    if (projectMatch) {
      const projectId = projectMatch[1]!

      if (request.method === 'GET') {
        const rec = await getProject(redis, user.userId, projectId)
        if (!rec) return json({ error: 'Not found' }, 404)
        const role = (await isOwner(redis, user.userId, projectId)) ? 'owner' : 'member'
        return json({
          project: {
            id: projectId,
            name: rec.name,
            updatedAt: rec.updatedAt,
            state: rec.state,
            role,
          },
        })
      }

      if (request.method === 'PUT') {
        let raw: unknown
        try {
          raw = await request.json()
        } catch {
          return json({ error: 'Invalid JSON' }, 400)
        }
        const o = raw as { state?: unknown }
        const state = parseWeddingState(o.state)
        if (!state) {
          return json({ error: 'Invalid seating state' }, 400)
        }
        const meta = await saveProjectState(redis, user.userId, projectId, state)
        if (!meta) return json({ error: 'Not found' }, 404)

        const realtime = new Realtime({ schema: seatingRealtimeSchema, redis })
        const channel = realtime.channel(`project:${projectId}`)
        const stateJson = JSON.stringify(state)
        await channel.emit('seating.updated', { stateJson })

        return json({ project: meta })
      }

      if (request.method === 'PATCH') {
        let raw: unknown
        try {
          raw = await request.json()
        } catch {
          return json({ error: 'Invalid JSON' }, 400)
        }
        const o = raw as { name?: string }
        if (typeof o.name !== 'string') {
          return json({ error: 'name required' }, 400)
        }
        const meta = await renameProject(redis, user.userId, projectId, o.name)
        if (!meta) return json({ error: 'Not found' }, 404)
        return json({ project: meta })
      }
    }

    return new Response('Not Found', { status: 404 })
  },
} satisfies ExportedHandler<Env>
