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

### Deploy to production

This application relies files `/usr/share/nginx/html/config.js` and `/usr/share/nginx/html/config.json` to provide runtime configuration.

**config.js**

.public/config.js
```
const config = (() => {
  return {
    "OAUTH_DOMAIN": "oauth domain",
    "OAUTH_CLIENTID": "xxx",
    "OAUTH_AUDIENCE": "http://localhost:8080/api"
  };
})();
```

A similar config file can be generate to simplify the updatecli login parameter

**config.json**

.public/config.json
```
{
   "OAUTH_DOMAIN": "oauth domain",
   "OAUTH_CLIENTID": "xxx",
   "OAUTH_AUDIENCE": "http://localhost:8080/api"
}
})();
```

For the local development environment, those two files must be located in the directory `public`.
A gitignore rule ensure those two files are not committed to the git repository.

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
