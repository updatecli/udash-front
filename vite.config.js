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
    test: {
      environment: 'jsdom',
      // Pinned so date assertions read the same on every machine and in CI.
      env: { TZ: 'UTC' },
      setupFiles: ['src/test/setup.js'],
      // Vuetify imports its own CSS, which Vite has to handle rather than Node.
      server: { deps: { inline: ['vuetify'] } },
    },
    server: {
      proxy: {
        '^/api': {
          //target: env.VITE_DEV_PROXY_TARGET || 'https://api.uda.sh/updatecli',
          //rewrite: (path) => path.replace(/^\/api/, '/'),
          //target: env.VITE_DEV_PROXY_TARGET || 'http://localhost:8080',
          target: env.VITE_DEV_PROXY_TARGET || 'https://updatecli.uda.sh',
          changeOrigin: true,
          ws: true,
        },
      },
    },
  }
})
