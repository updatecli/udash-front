import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import { loadFonts } from './plugins/webfontloader'
import router from './router'
import { createAuth0 } from "@auth0/auth0-vue";
import authConfig from "../auth_config.json";

loadFonts()

createApp(App).use(router)
  .use(vuetify)
  .use(
    createAuth0({
      domain: authConfig.domain,
      clientId: authConfig.clientId,
      authorizationParams: {
        redirect_uri: window.location.origin,
        audience: authConfig.audience,
      }
    })
  )
  .mount('#app')
