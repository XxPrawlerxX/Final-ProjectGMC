import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Send /api calls to the payment server (npm run server) during development
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
})
