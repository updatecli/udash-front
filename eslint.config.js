const pluginVue = require('eslint-plugin-vue')
const js = require('@eslint/js')
const globals = require('globals')
const babelParser = require('@babel/eslint-parser')

module.exports = [
  ...pluginVue.configs['flat/essential'],
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        config: 'readonly',
      },
      parserOptions: {
        parser: babelParser,
        requireConfigFile: false,
      },
    },
    rules: {
      'vue/valid-v-slot': ['error', { allowModifiers: true }],
    },
  },
]
