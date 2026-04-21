# Environment variables

## Browser (Vite)

Set at build time (e.g. Cloudflare dashboard **Settings → Environment variables** for the Workers project, or a `.env` file locally).

| Variable                     | Required       | Description                                                                                                |
| ---------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------- |
| `VITE_CLERK_PUBLISHABLE_KEY` | For cloud sync | Clerk publishable key. If unset, the app runs in **local-only** mode (no sign-in, data in `localStorage`). |
| `VITE_BASE_PATH`             | Optional       | Vite `base`, e.g. `/` or `/repo-name/` for GitHub Pages-style hosting. Defaults to `/`.                    |

## Worker (Cloudflare secrets / `.dev.vars`)

Never commit real values. For local development, copy `.dev.vars.example` to `.dev.vars` and fill in values.

| Variable                      | Description                                        |
| ----------------------------- | -------------------------------------------------- |
| `VITE_UPSTASH_REDIS_REST_URL` | From [Upstash Redis](https://console.upstash.com/) |
| `UPSTASH_REDIS_REST_TOKEN`    | Same                                               |
| `CLERK_SECRET_KEY`            | Clerk **Secret** key (Dashboard → API Keys)        |
| `VITE_CLERK_PUBLISHABLE_KEY`  | Clerk **Publishable** key                          |

The Worker uses `VITE_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` with `authenticateRequest` on `/api/*` (except Upstash Realtime’s own auth path under `/api/realtime`). HTTP routing is implemented with **Hono** in [`worker/app.ts`](worker/app.ts).

## Deploy (Cloudflare Workers + assets)

After `npm run build`, the Vite + Cloudflare plugin writes a deployable bundle under `dist/event_seating/`, including **`dist/event_seating/wrangler.json`**. Deploy with:

```bash
wrangler deploy --config dist/event_seating/wrangler.json
```

That generated config keeps `assets.run_worker_first: ["/api/*"]` from the source [`wrangler.jsonc`](wrangler.jsonc) so `/api/*` hits the Worker (Hono) before static assets.

The app uses client-side routes such as `/projects/:projectId`. Shareable URLs and hard refreshes on those paths rely on Wrangler **`assets.not_found_handling: "single-page-application"`** in [`wrangler.jsonc`](wrangler.jsonc): requests that do not match a static file still return `index.html`, and the React router reads the path. Do not remove SPA fallback unless you replace it with an equivalent document fallback.

Set the same secrets in the Cloudflare dashboard (or `wrangler secret put`).

## GitHub Pages vs Cloudflare

The workflow [`.github/workflows/deploy-github-pages.yml`](.github/workflows/deploy-github-pages.yml) uploads **client static files** from `dist` only. It does **not** deploy the Worker: there is **no `/api/*`** on Pages unless you host the SPA elsewhere and point it at a deployed Worker origin.

**Authoritative full-stack hosting** (API + SPA + realtime) is the **Wrangler** deploy above.

## HTTP API contract (regression / compatibility)

These shapes are what [`src/sync/projectApi.ts`](src/sync/projectApi.ts) expects. Changes should stay backward compatible (additive JSON fields only unless versioned).

| Method & path | Success body (summary) |
| ------------- | ---------------------- |
| `GET /api/projects` | `{ projects: ProjectMeta[] }` |
| `POST /api/projects` | `{ project: ProjectMeta }` |
| `GET /api/projects/:id` | `{ project: { id, name, updatedAt, state, role } }` |
| `PUT /api/projects/:id` | `{ project: ProjectMeta }` — emits realtime `seating.updated` with `{ stateJson }` |
| `PATCH /api/projects/:id` | `{ project: ProjectMeta }` |
| `POST /api/projects/:id/invites` | `{ invite: { token, expiresInSeconds } }` |
| `POST /api/invites/accept` | `{ project: ProjectMeta }` |
| `POST /api/realtime` | Upstash Realtime handler (channels `project:{uuid}`) |

Common errors: `{ "error": string }` with `400`, `401`, `403`, `404`; optional **`409`** on `PUT /api/projects/:id` when the client sends **`If-Match`** (quoted or raw) with a value that does not match the server’s current `updatedAt` (opt-in concurrency; clients that omit `If-Match` keep last-write-wins).

## Redis layout (backward compatible)

Legacy keys remain supported:

- Project blob: `seating:project:{id}` (JSON document).
- Legacy members list: `seating:project:{id}:members` (JSON string array).

Newer optimizations (optional on read; dual-written where needed):

- `seating:project:{id}:meta` — hash with `ownerId`, `name`, `updatedAt`.
- `seating:project:{id}:member_set` — Redis SET of collaborator user ids; empty set falls back to legacy JSON.

## Intentional exceptions

None at the time of this document; list any future breaking API flags here if they ship behind opt-in headers or paths.
