import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:5000',
      '/problem': 'http://localhost:5000',
      '/submit': 'http://localhost:5000',
      '/admin': 'http://localhost:5000',
    },
  },
})

