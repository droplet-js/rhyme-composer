import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** GitHub project site: base is /repo-name/. CI sets VITE_BASE_PATH (no trailing slash is ok). */
function viteBase(): string {
  const raw = process.env.VITE_BASE_PATH?.trim()
  if (!raw || raw === '/') return '/'
  return raw.endsWith('/') ? raw : `${raw}/`
}

// https://vite.dev/config/
export default defineConfig({
  base: viteBase(),
  plugins: [react()],
})
