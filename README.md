# udash

This project contains the frontend of Udash, a dashboard to monitor and manage Updatecli instances.

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run dev
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

This application relies on the `config.json` file at `/usr/share/nginx/html/config.json` for runtime configuration.

The frontend base path is defined at runtime with `APP_BASE_PATH`.
Set it in the runtime config files to mount the SPA below a subpath such as `/udash/`.

**config.json**

.public/config.json
```
{
   "OAUTH_DOMAIN": "oauth domain",
   "OAUTH_CLIENTID": "xxx",
   "OAUTH_AUDIENCE": "http://localhost:8080/api",
   "API_BASE_URL": "/api",
   "APP_BASE_PATH": "/udash/"
}
```

The app bootstraps from `config.json` before loading the Vue bundle, then exposes the same values on `window.config`.

For the local development environment, the runtime config file must be located at `public/config.json`.
A `.gitignore` rule ensures this file is not committed to the git repository.

#### Docker

The docker image configuration can be overridden by mounting a custom `config.json` file at runtime.

```
docker run -d -p 80:80 \
  -v /path/to/config.json:/usr/share/nginx/html/config.json \
  --name udash-front udash-front:latest
```

### Customize configuration
See [Vite Configuration Reference](https://vite.dev/config/).
