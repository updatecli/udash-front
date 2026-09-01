import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import { loadFonts } from './plugins/webfontloader'
import router from './router'
import { initAuth, consumeReturnTo } from '@/composables/auth'

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

  // Initialize OIDC (and process any login callback) before mounting so route guards
  // and the UI see the resolved auth state. Called in every mode: initAuth resolves
  // immediately when there is no login configured, and it is the only thing that settles
  // the auth state the components read.
  await initAuth()

  // After a login redirect, navigate back to the originally requested route.
  const returnTo = consumeReturnTo()
  if (returnTo) {
    router.replace(returnTo)
  }

  app.mount('#app')
}

bootstrap()
