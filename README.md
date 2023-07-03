# udash

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

## Deploy to production

For being able to have runtime configuration, we rely on the file `/usr/share/nginx/html/config.js` with the following content:

```
const config = (() => {
  return {
    "OAUTH_DOMAIN": "oauth domain",
    "OAUTH_CLIENTID": "xxx",
    "OAUTH_AUDIENCE": "http://localhost:8080/api"
  };
})();
```

For the local development environment, this file must be located in `public/config.js`.
It shouldn't be commit to the git repository

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
