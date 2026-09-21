// Styles
import 'vuetify/styles'
import { icons } from './icons'

// Vuetify
// Components and directives are auto-imported by vite-plugin-vuetify; don't register them here.
import { createVuetify } from 'vuetify'

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
  icons,
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
