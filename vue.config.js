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

  pluginOptions: {
    vuetify: {
            // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vuetify-loader
        }
  }
})

