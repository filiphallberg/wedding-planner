# Event seating planner

React + Vite SPA for arranging guests at tables, with optional **cloud sync** (Clerk + Upstash Redis + realtime) on **Cloudflare Workers** (static assets + Hono API on the same Worker).

## Run locally

```bash
npm install
npm run dev
```

With cloud sync, copy `.dev.vars.example` to `.dev.vars` and add secrets (see [ENVIRONMENT.md](ENVIRONMENT.md)).

## Deploy (full stack)

Production uses **Wrangler** with the config Vite emits next to the worker bundle:

```bash
npm run build
wrangler deploy --config dist/event_seating/wrangler.json
```

See [ENVIRONMENT.md](ENVIRONMENT.md) for variables, API compatibility notes, and how this differs from the optional **GitHub Pages** static workflow.
