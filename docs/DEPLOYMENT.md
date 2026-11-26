# Deployment

The app is two deployable units: a Rails API and a static React build. Both need a MySQL database.

## Option A: docker compose (single host or VM)

```bash
docker compose up --build -d
docker compose exec api bin/rails db:seed
# UI on http://<host>:8080 ; nginx serves the SPA and proxies /api to the api service
```

Before exposing it publicly, change `SECRET_KEY_BASE` and the MySQL password in `docker-compose.yml`, or move them into an `.env` file. Then put TLS in front of it (Caddy or a load balancer) and set `FORCE_SSL=true`.

> Note: the Dockerfiles were written alongside the rest of the app, but they couldn't be build-tested in the development environment because the Docker daemon wasn't running. Production boot was checked with `RAILS_ENV=production bin/rails runner`.

## Option B: PaaS (e.g. Render)

1. **Database:** create a managed MySQL instance (for example Aiven, PlanetScale or Railway MySQL). Note its URL.
2. **API:** create a Web Service from `backend/` using the Docker runtime.
   - Env: `DATABASE_URL=mysql2://user:pass@host:3306/db`, `SECRET_KEY_BASE=$(bin/rails secret)`, `CORS_ORIGINS=https://<frontend-domain>`.
   - Health check path: `/up`.
   - After the first deploy, run `bin/rails db:seed` in the service shell.
3. **UI:** create a Static Site from `frontend/`.
   - Build command: `npm ci && npm run build`. Publish directory: `dist`.
   - Env: `VITE_API_BASE_URL=https://<api-domain>`.
   - Rewrite rule: `/*` → `/index.html`.

## Environment variables

| Var | Where | Default | Purpose |
|---|---|---|---|
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` | API | 127.0.0.1 / 3306 / root / "" | MySQL connection |
| `DATABASE_URL` | API (prod) | – | Overrides the individual DB vars |
| `SECRET_KEY_BASE` | API (prod) | – | Required in production |
| `CORS_ORIGINS` | API | `http://localhost:5173` | Comma-separated list of allowed UI origins |
| `FORCE_SSL` | API (prod) | `true` | Set to `false` when running behind plain HTTP locally |
| `SEED_COUNT`, `SEED_RANDOM` | seeding | 10000, 42 | Volume and dataset variant |
| `VITE_API_BASE_URL` | UI build | "" (same origin) | API origin when it's hosted separately |
| `API_PROXY_TARGET` | UI dev | `http://localhost:3000` | Where the Vite dev server proxies `/api` |
