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
   "OAUTH_DOMAIN": "https://your-instance.zitadel.cloud",
   "OAUTH_CLIENTID": "xxx",
   "OAUTH_SCOPE": "openid profile email offline_access urn:zitadel:iam:org:project:id:PROJECT_ID:aud",
   "API_BASE_URL": "/api",
   "APP_BASE_PATH": "/udash/"
}
```

The app bootstraps from `config.json` before loading the Vue bundle, then exposes the same values on `window.config`.

#### Authentication (OIDC)

Authentication uses the standards-based OpenID Connect Authorization Code + PKCE
flow via [`oidc-client-ts`](https://github.com/authts/oidc-client-ts), and works
with any compliant provider (the reference deployment uses [Zitadel](https://zitadel.com)).
It is toggled at build time with `VITE_AUTH_ENABLED` (`.env`) and configured at
runtime through `config.json`:

- `OAUTH_DOMAIN` — the provider's issuer URL (e.g. `https://your-instance.zitadel.cloud`).
- `OAUTH_CLIENTID` — the SPA application's client ID.
- `OAUTH_SCOPE` — requested scopes. Include `openid profile email offline_access`
  (`offline_access` enables silent token refresh). For Zitadel, add the project
  audience scope `urn:zitadel:iam:org:project:id:<PROJECT_ID>:aud` so the access
  token is accepted by the API. Defaults to `openid profile email offline_access`
  when omitted.

Register the app in the provider as a **User Agent / SPA** application with
**PKCE**, and add the app's base URL (the value of `APP_BASE_PATH` resolved
against the deployment origin) as both an allowed **redirect URI** and
**post-logout redirect URI**.

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
