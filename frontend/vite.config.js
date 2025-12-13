import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// URL do backend - usa variável de ambiente ou fallbacks
const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://backend:8000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    // Permitir qualquer host (necessário para ngrok, etc.)
    allowedHosts: true,
    proxy: {
      '/api': {
        target: BACKEND_URL,
        changeOrigin: true,
      },
      '/admin': {
        target: BACKEND_URL,
        changeOrigin: true,
      },
      '/static': {
        target: BACKEND_URL,
        changeOrigin: true,
      },
    },
  },
})
