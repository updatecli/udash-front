import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import { loadFonts } from './plugins/webfontloader'
import router from './router'
import { createAuth0 } from '@auth0/auth0-vue'
import { getAppBaseUrl, getRuntimeConfig, isAuthEnabled } from '@/composables/runtime'

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

const runtimeConfig = getRuntimeConfig()

const app = createApp(App)
  .use(router)
  .use(vuetify)

if (isAuthEnabled) {
  app.use(
    createAuth0({
      domain: runtimeConfig.OAUTH_DOMAIN,
      clientId: runtimeConfig.OAUTH_CLIENTID,
      authorizationParams: {
        redirect_uri: getAppBaseUrl(),
        audience: runtimeConfig.OAUTH_AUDIENCE,
      }
    })
  )
}

app
  .directive('highlight', highlightDirective)
  .mount('#app')
