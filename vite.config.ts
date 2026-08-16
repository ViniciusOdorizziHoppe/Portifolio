import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/sigaa': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
