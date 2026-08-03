import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Relative base so the built app works when loaded via file:// in Electron
  base: './',
  plugins: [react()],
  server: {
    port: 3210,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'highlight': ['highlight.js'],
          'marked': ['marked', 'marked-highlight', 'marked-gfm-heading-id'],
        },
      },
    },
  },
})
