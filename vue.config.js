const { defineConfig } = require('@vue/cli-service')
const EslintWebpackPlugin = require('eslint-webpack-plugin')

module.exports = defineConfig({
  transpileDependencies: true,

  devServer: {
    proxy: {
      "^/api": {
        target: 'http://localhost:8080',
        ws: true,
        changeOrigin: true,
        pathRewrite: {
          '^/api': '/api'
        },
      },
    },
  },

  chainWebpack: config => {
    config.plugins.delete('eslint')
    config.plugin('eslint').use(EslintWebpackPlugin, [{
      extensions: undefined,
      context: __dirname,
      cwd: __dirname,
      configType: 'flat',
      failOnError: true,
      formatter: 'stylish',
    }])
  },
  //  make this app "location agnostic"
  publicPath: './',
  pluginOptions: {
    vuetify: {
      // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vuetify-loader
    }
  }
})

