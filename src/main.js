import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
// Fonts ship with the app rather than from Google Fonts: self-hosted instances often run on
// networks that cannot reach it. Only the weights in use are included.
import '@fontsource/space-grotesk/400.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/600.css'
import '@fontsource/space-grotesk/700.css'
import '@fontsource/orbitron/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import router from './router'
import { initAuth, consumeReturnTo } from '@/composables/auth'

import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import yaml from 'highlight.js/lib/languages/yaml'
import './styles/code.scss'

hljs.registerLanguage('bash', bash)
hljs.registerLanguage('yaml', yaml)

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
