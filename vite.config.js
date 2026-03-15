import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

// Replaces __BUILD_ID__ in dist/sw.js with a compact base-36 timestamp
// so each build gets a unique cache key, auto-invalidating old caches.
function swVersionPlugin() {
  return {
    name: 'sw-version',
    closeBundle() {
      const swPath = resolve(__dirname, 'dist/sw.js')
      try {
        const buildId = Date.now().toString(36)
        const sw = readFileSync(swPath, 'utf-8').replace('__BUILD_ID__', buildId)
        writeFileSync(swPath, sw)
        console.log(`[sw-version] Cache key → la-guia-${buildId}`)
      } catch { /* not a build run or sw.js missing */ }
    },
  }
}

export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : '/LA-GUIA/',
  plugins: [react(), swVersionPlugin()],
  optimizeDeps: {
    include: ['three'],
  },
}))
