// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Vuetify
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const darkTheme = {
  dark: true,
  colors: {
    background: '#070B12',
    surface: '#0F1624',
    primary: '#39FFB6',
    'primary-darken-1': '#20C98C',
    secondary: '#5AD1FF',
    'secondary-darken-1': '#2E9BC9',
    error: '#FF5D7A',
    info: '#7CCBFF',
    success: '#3DFF9A',
    warning: '#FFC857',
  }
}

const lightTheme = {
  dark: false,
  colors: {
    background: '#F4F9FF',
    surface: '#FFFFFF',
    primary: '#0E9F6E',
    'primary-darken-1': '#0B7A55',
    secondary: '#0E6E99',
    'secondary-darken-1': '#0A5575',
    error: '#C62828',
    info: '#1E88E5',
    success: '#2E7D32',
    warning: '#C77800',
  }
}

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: "system",
    themes: {
      light: lightTheme,
      dark: darkTheme,
    }
  }
}
  // https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
)
