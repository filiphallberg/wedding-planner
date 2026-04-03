# Environment variables

## Browser (Vite)

Set at build time (e.g. Cloudflare dashboard **Settings → Environment variables** for the Pages/Workers project, or a `.env` file locally).

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

The Worker uses `VITE_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` with `authenticateRequest` on `/api/*` and `/api/realtime`.

## Deploy

After `npm run build`, deploy with Wrangler using the generated config (worker name may match your Vite entry):

```bash
wrangler deploy --config dist/wedding_seating/wrangler.json
```

Set the same secrets in the Cloudflare dashboard (or `wrangler secret put`).
