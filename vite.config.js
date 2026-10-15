import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'https://tourbee-fleet-backend-1.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/media': {
        target: 'https://tourbee-fleet-backend-1.onrender.com',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
