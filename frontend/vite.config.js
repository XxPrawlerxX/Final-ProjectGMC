import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Pinned to a distinctive port with strictPort so the dev server
    // fails loudly instead of silently drifting to a random free port
    // (this machine has other unrelated projects that also default to
    // 5173/5174) — the backend's CORS + Paystack callback_url config
    // must match this exact origin.
    port: 5180,
    strictPort: true,
    // Listen on all interfaces (not just localhost) so a phone on the
    // same WiFi can reach this dev server via the PC's LAN IP.
    host: true,
  },
})
