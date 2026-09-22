import { config } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import { icons } from '@/plugins/icons'

// jsdom has no layout, so it lacks the observers Vuetify components reach for.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Components are mounted with the app's own icon set so an icon missing from ICONS
// fails here rather than rendering blank in the browser.
config.global.plugins = [createVuetify({ icons })]

// An icon missing from ICONS only warns in the browser; in a test it fails.
const warn = console.warn
console.warn = (...args) => {
  if (String(args[0]).includes('is not registered in src/plugins/icons.js')) {
    throw new Error(args[0])
  }
  warn(...args)
}
