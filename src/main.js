import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import { loadFonts } from './plugins/webfontloader'
import router from './router'
import { initAuth, consumeReturnTo } from '@/composables/auth'
import { isAuthEnabled } from '@/composables/runtime'

import hljs from 'highlight.js'
//import 'highlight.js/styles/atom-one-dark.css'
import 'highlight.js/styles/default.css'

loadFonts()

// Custom directive for highlight.js
const highlightDirective = {
  beforeMount(el) {
    hljs.highlightElement(el)
  },
  updated(el) {
    hljs.highlightElement(el)
  }
}

async function bootstrap() {
  const app = createApp(App)
    .use(router)
    .use(vuetify)
    .directive('highlight', highlightDirective)

  if (isAuthEnabled) {
    // Initialize OIDC (and process any login callback) before mounting so
    // route guards and the UI see the resolved auth state.
    await initAuth()

    // After a login redirect, navigate back to the originally requested route.
    const returnTo = consumeReturnTo()
    if (returnTo) {
      router.replace(returnTo)
    }
  }

  app.mount('#app')
}

bootstrap()
