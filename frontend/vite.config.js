import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 9562,
    host: true,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'taskme.motorsights.com',
      'api-taskme.motorsights.com'
    ],
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL ? process.env.VITE_API_URL.replace('/api', '') : 'http://localhost:9561',
        changeOrigin: true,
        secure: false
      }
    }
  },
  define: {
    global: 'globalThis',
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
})
