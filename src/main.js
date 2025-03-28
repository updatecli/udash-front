import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import { loadFonts } from './plugins/webfontloader'
import router from './router'
import { createAuth0 } from "@auth0/auth0-vue";

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

createApp(App).use(router)
  .use(vuetify)
  .use(
    createAuth0({
      domain: config.OAUTH_DOMAIN,
      clientId: config.OAUTH_CLIENTID,
      authorizationParams: {
        redirect_uri: window.location.origin,
        audience: config.OAUTH_AUDIENCE,
      }
    })
  )
  .directive('highlight', highlightDirective) // Register the directive globally
  .mount('#app')
