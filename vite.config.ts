import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/** GitHub project pages: `/repo-name/`. User/org site (`*.github.io` repo): `/`. */
const base = process.env.VITE_BASE_PATH?.trim() || '/'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base,
})
