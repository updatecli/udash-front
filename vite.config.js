import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: './',
    plugins: [
      vue(),
      vuetify({
        styles: {
          configFile: 'src/styles/settings.scss',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '^/api': {
          //target: env.VITE_DEV_PROXY_TARGET || 'https://api.uda.sh/updatecli',
          //rewrite: (path) => path.replace(/^\/api/, '/'),
          target: env.VITE_DEV_PROXY_TARGET || 'http://localhost:8080',
          changeOrigin: true,
          ws: true,
        },
      },
    },
  }
})
