/** Prefix with Vite `base` (e.g. `/` or `/repo-name/`) for fetch and EventSource. */
export function appUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}
