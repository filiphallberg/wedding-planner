import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Read a string value from `wrangler.jsonc` `vars`.
 * Deploy/CI often has no `.env`, but Wrangler vars are already the source of truth for production;
 * Vite only embeds `VITE_*` at build time, so we merge them here for the client bundle.
 */
function wranglerStringVar(key: string): string | undefined {
  const path = resolve(__dirname, 'wrangler.jsonc')
  if (!existsSync(path)) return undefined
  try {
    const raw = readFileSync(path, 'utf8')
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(`"${escapedKey}"\\s*:\\s*"([^"]*)"`)
    const m = re.exec(raw)
    return m?.[1]
  } catch {
    return undefined
  }
}

/** GitHub project pages: `/repo-name/`. User/org site (`*.github.io` repo): `/`. Cloudflare: usually `/`. */
const base = process.env.VITE_BASE_PATH?.trim() || '/'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const clerkPublishableKey =
    env.VITE_CLERK_PUBLISHABLE_KEY || wranglerStringVar('VITE_CLERK_PUBLISHABLE_KEY') || ''

  return {
    plugins: [react(), tailwindcss(), cloudflare()],
    base,
    define: {
      'import.meta.env.VITE_CLERK_PUBLISHABLE_KEY': JSON.stringify(clerkPublishableKey),
    },
  }
})
