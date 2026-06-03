# CMA Awards

## Local Development

Create `.env` from `.example-env` and fill in the OpenWater credentials. The local API server reads either `OPEN_WATER_*` or `VITE_OPEN_WATER_*` variables.

The review password gate is controlled by environment variables:

```sh
AWARDS_ACCESS_ENABLED=true
AWARDS_ACCESS_PASSWORD=CmC4w4Rd5!
```

Set `AWARDS_ACCESS_ENABLED=false` to disable the gate. When enabled, successful access is stored in the browser for 1 hour and all awards API endpoints require the generated access token.

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

```sh
docker compose up --build
```
