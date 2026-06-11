// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Vuetify
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const updatecliTheme = {
  dark: true,
  colors: {
    background: '#FFFFFF',
    surface: '#FFFFFF',
    primary: '#6200EE',
    'primary-darken-1': '#3700B3',
    secondary: '#03DAC6',
    'secondary-darken-1': '#018786',
    error: '#B00020',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FB8C00',
  }
}

const spaceTheme = {
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

const spaceLightTheme = {
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

const deepSpaceNavyTheme = {
  dark: true,
  colors: {
    background: '#060A14',
    surface: '#0C1426',
    primary: '#34D8FF',
    'primary-darken-1': '#1D9FC4',
    secondary: '#7CF7FF',
    'secondary-darken-1': '#3CC4CE',
    error: '#FF6A8B',
    info: '#66B3FF',
    success: '#3DE9A9',
    warning: '#FFD166',
  }
}

const nebulaGlowTheme = {
  dark: true,
  colors: {
    background: '#120A24',
    surface: '#1B1333',
    primary: '#D36CFF',
    'primary-darken-1': '#9A46C9',
    secondary: '#52E7FF',
    'secondary-darken-1': '#2AA8C2',
    error: '#FF5F8A',
    info: '#74C0FF',
    success: '#47E0A1',
    warning: '#FFC76A',
  }
}

export default createVuetify({
  components,
  directives,
  theme: {
    //defaultTheme: "dark",
    //defaultTheme: "light",
    // Valid values: updatecliTheme | updatecliLightTheme | deepSpaceNavyTheme | nebulaGlowTheme
    defaultTheme: "spaceTheme",
    //defaultTheme: "updatecliTheme",
    //defaultTheme: "deepSpaceNavyTheme",
    //defaultTheme: "nebulaGlowTheme",
    //defaultTheme: "spaceLightTheme",
    themes: {
      updatecliTheme: updatecliTheme,
      spaceTheme: spaceTheme,
      spaceLightTheme: spaceLightTheme,
      deepSpaceNavyTheme: deepSpaceNavyTheme,
      nebulaGlowTheme: nebulaGlowTheme,
    }
  }
}
  // https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
)
