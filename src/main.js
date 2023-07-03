import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import { loadFonts } from './plugins/webfontloader'
import router from './router'
import { createAuth0 } from "@auth0/auth0-vue";

loadFonts()

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
  .mount('#app')
