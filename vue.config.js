const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,

  devServer: {
      proxy: {
        "^/api": {
          target: 'http://localhost:8080',
          ws: true,
          changeOrigin: true,
          pathRewrite: {
            '^/api' : '/api' 
            },
          },
      },  
  },  

  //  make this app "location agnostic"
  publicPath: './',

  pluginOptions: {
    vuetify: {
            // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vuetify-loader
        }
  }
})

