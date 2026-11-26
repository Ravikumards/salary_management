# Deployment

The app is **one Rails web application**: a single image or process serves the React UI and the `/api/v1` JSON API. The only other piece it needs is a MySQL database.

## Option A: docker compose (single host or VM)

```bash
docker compose up --build -d
docker compose exec app bin/rails db:seed
open http://localhost:8080
```

Before exposing it publicly, change `SECRET_KEY_BASE` and the MySQL password, or move them into an `.env` file. Then put TLS in front of it (Caddy or a load balancer) and set `FORCE_SSL=true`.

> The Dockerfile couldn't be build-tested in the development environment because the Docker daemon wasn't running. The production path was verified locally instead:
> 1. `RAILS_ENV=production bin/rails assets:precompile`
> 2. `bin/rails s` with `RAILS_ENV=production`
> 3. The UI, deep links, API JSON and the JSON 404 were all checked on one port.

## Option B: PaaS (e.g. Render, Fly.io, Heroku)

1. Create a managed MySQL instance and note its URL.
2. Create a single Web Service from the repository root using the Dockerfile.
   - Env: `DATABASE_URL=mysql2://user:pass@host:3306/db` and `SECRET_KEY_BASE=$(bin/rails secret)`.
   - Health check path: `/up`.
3. After the first deploy, run `bin/rails db:seed` in the service shell.

## Environment variables

| Var | Default | Purpose |
|---|---|---|
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` | 127.0.0.1 / 3306 / root / "" | MySQL connection |
| `DATABASE_URL` | – | Overrides the individual DB vars in production |
| `SECRET_KEY_BASE` | – | Required in production |
| `FORCE_SSL` | `true` | Set to `false` when running behind plain HTTP locally |
| `RAILS_SERVE_STATIC_FILES` | `1` in the image | Rails serves `public/vite` assets |
| `SEED_COUNT`, `SEED_RANDOM` | 10000, 42 | Seed volume and dataset variant |
