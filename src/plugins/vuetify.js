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
    // A mid green instead of the brand's neon, so "all fine" is the quietest
    // status on screen.
    success: '#3FB27A',
    warning: '#FFC857',
    // Pipeline results without a semantic colour of their own. Success, changed and
    // failed use success, warning and error.
    'result-waiting': '#60A5FA',
    'result-skipped': '#9CA3AF',
    'result-unknown': '#A78BFA',
  }
}

const lightTheme = {
  dark: false,
  colors: {
    background: '#F4F9FF',
    surface: '#FFFFFF',
    primary: '#0B7A55',
    'primary-darken-1': '#095E42',
    secondary: '#0E6E99',
    'secondary-darken-1': '#0A5575',
    error: '#BE2626',
    info: '#1A6FD1',
    success: '#2A732E',
    warning: '#915806',
    'result-waiting': '#225BD8',
    'result-skipped': '#5E6471',
    'result-unknown': '#7A39E8',
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
