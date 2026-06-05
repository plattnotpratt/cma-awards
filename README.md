# CMA Awards

## Local Development

Create `.env` from `.example-env` and fill in the OpenWater credentials. The local API server reads either `OPEN_WATER_*` or `VITE_OPEN_WATER_*` variables.

Run the frontend and local API server together:

```sh
npm run dev
```

Vite serves the app and proxies `/local-api` to the local Express server on port `3001`. Award list data comes from the local SQLite database, and award detail requests are proxied by the Express server to the OpenWater API so credentials stay server-side.

If you only need the frontend without the local API process, run:

```sh
npm run dev:web
```

## Docker

Docker Compose keeps the frontend and API as separate services. nginx proxies `/local-api` from the web container to the `api` service, so the browser uses the same `/local-api` paths in both local development and Docker.

The deployed Docker site is protected by Caddy Basic Auth. Add these values to `.env` before starting Compose:

```sh
CADDY_BASICAUTH_USER=review
CADDY_BASICAUTH_PASSWORD=your-password
```

Docker generates the hashed Caddy password at container startup, so the plain text password only needs to be configured in `.env`.

```sh
docker compose up --build
```
