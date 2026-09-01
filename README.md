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
   "AUTH_ENABLED": false,
   "AUTH_VISIBILITY": "private",
   "OAUTH_DOMAIN": "https://your-instance.zitadel.cloud",
   "OAUTH_CLIENTID": "xxx",
   "OAUTH_SCOPE": "openid profile email offline_access urn:zitadel:iam:org:project:id:PROJECT_ID:aud",
   "API_BASE_URL": "/api",
   "APP_BASE_PATH": "/udash/",
   "MAX_HISTORY_DAYS": 30
}
```

The app bootstraps from `config.json` before loading the Vue bundle, then exposes the same values on `window.config`.

`MAX_HISTORY_DAYS` caps how far back the interface looks: it sets how far the dashboard
date filter reaches and the window of the activity chart on the home page. It defaults to
`30` when unset and is capped at the API's own maximum of `366`.

Raising it does not change how much work the backend does by default — the date filter
still starts on the last day whatever the maximum, so a wider range is only ever queried
when someone explicitly asks for one. Lower it on instances where a large report history
makes the wider queries expensive.

#### Authentication (OIDC)

Authentication uses the standards-based OpenID Connect Authorization Code + PKCE
flow via [`oidc-client-ts`](https://github.com/authts/oidc-client-ts), and works
with any compliant provider (the reference deployment uses [Zitadel](https://zitadel.com)).
It is toggled and configured entirely at runtime through `config.json`, so the same
image serves both authenticated and open deployments:

- `AUTH_ENABLED` — set to `true` to require authentication. Defaults to `false`.
- `AUTH_VISIBILITY` — `public` or `private`. Only read when `AUTH_ENABLED` is `true`.
  Defaults to `private`.
  - `private` — reports, the SCM dashboard and the home page activity chart all require
    a session. Signing in is the price of admission.
  - `public` — anyone may browse reports, the dashboard and the activity chart without an
    account. Signing in adds the profile and the API tokens page, and is what a runner
    needs to publish reports.
- `OAUTH_DOMAIN` — the provider's issuer URL (e.g. `https://your-instance.zitadel.cloud`).
- `OAUTH_CLIENTID` — the SPA application's client ID.
- `OAUTH_SCOPE` — requested scopes. Include `openid profile email offline_access`
  (`offline_access` enables silent token refresh). For Zitadel, add the project
  audience scope `urn:zitadel:iam:org:project:id:<PROJECT_ID>:aud` so the access
  token is accepted by the API. Defaults to `openid profile email offline_access`
  when omitted.

`AUTH_VISIBILITY` must match the API's own `server.auth.visibility`, which takes the same
two values. Note the defaults differ on purpose: the API defaults to `public`, this
frontend to `private`, so that upgrading an existing instance never starts serving its
data to anonymous visitors on its own. A stock API paired with a stock frontend therefore
asks for a login it does not strictly need — the harmless direction. The reverse, a
frontend set to `public` against a private API, sends anonymous requests the API refuses;
the first refusal redirects the visitor to the identity provider, so the instance behaves
private rather than rendering empty pages.

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
