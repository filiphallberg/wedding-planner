/** Strip trailing slash for React Router `basename` (root → `""`). */
export function routerBasename(): string {
  return import.meta.env.BASE_URL.replace(/\/$/, '');
}

/** Prefix with Vite `base` for client routes, but keep API at root `/api/*`. */
export function appUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (p === '/api' || p.startsWith('/api/')) {
    return p;
  }

  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}${p}`;
}
