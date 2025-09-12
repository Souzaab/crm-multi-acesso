import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
// import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = env.VITE_API_URL || 'http://localhost:4000'
  
  return {
    base: '/',
    plugins: [react()], // tailwindcss()
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        '~backend/client': path.resolve(__dirname, 'client.ts'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '/api'),
        },
      },
    },
  }
})
