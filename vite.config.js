import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: './',
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '^/api': {
          target: env.VITE_DEV_PROXY_TARGET || 'http://localhost:8080/api',
          changeOrigin: true,
          ws: true,
          //rewrite: (path) => path.replace(/^\/api/, '/'),
        },
      },
    },
  }
})
