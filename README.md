# Salary Management

A minimal but usable salary management **web application** for an HR Manager in a 10,000-employee organization. It's a single Ruby on Rails app: Rails serves the React UI and the JSON API from one server.

- **Manage employees:** add, view, edit and delete. Includes search, filters, sorting and server-side pagination.
- **Salary insights:**
  - Min, max, average and median salary per country.
  - Average salary for a job title in a country, compared with the country average.
  - Breakdowns by job title and by department, a comparison across countries, the highest-paying titles and the employment mix.
- **Fast seeding:** 10,000 employees in about 0.9s, deterministic and safe to rerun.

| Layer | Tech |
|---|---|
| App | Ruby on Rails 8.1 + MySQL 8+ |
| UI | React 19 + TypeScript and MUI, bundled into Rails with Vite (`vite_rails`) |
| Tests | RSpec (83 examples, 99% line coverage), Vitest + React Testing Library (32 tests) |

![Employees](docs/screenshots/employees.png)
![Insights](docs/screenshots/insights.png)

## Quick start

Prerequisites: Ruby 3.3, Node 20+, MySQL 8+ running locally. The default is `root` with no password on 127.0.0.1:3306; override with `DB_HOST`, `DB_USERNAME` and `DB_PASSWORD`.

```bash
bundle install
npm install
bin/rails db:prepare
bin/rails db:seed        # 10,000 employees (SEED_COUNT=n to change)
bin/dev                  # Rails and the Vite dev server (hot reload): http://localhost:3000
# Port 3000 busy?  PORT=3001 bin/dev
```

## Tests and quality checks

```bash
bundle exec rspec                    # model, query, service and request specs, plus SimpleCov
npm test                             # React unit and component tests (Vitest)
npm run build                        # type-check and production build
npm run lint                         # oxlint
bundle exec rubocop && bundle exec brakeman
```

## Production / deployment

```bash
RAILS_ENV=production bin/rails assets:precompile   # vite build into public/vite
docker compose up --build                          # app + MySQL: http://localhost:8080
docker compose exec app bin/rails db:seed
```

`docs/DEPLOYMENT.md` explains how to deploy to a PaaS.

## API (`/api/v1`, JSON)

| Method | Path | Description |
|---|---|---|
| GET | `/employees` | List. Params: `q`, `country`, `job_title`, `department`, `sort`, `direction`, `page`, `per_page` (≤100) |
| GET | `/employees/:id` | Show |
| POST | `/employees` | Create. Body: `{ "employee": { ... } }` |
| PATCH | `/employees/:id` | Update |
| DELETE | `/employees/:id` | Delete |
| GET | `/insights/overview` | Org KPIs, per-country summary, top-paying titles, employment mix |
| GET | `/insights/countries/:country` | Min, max, avg, median, p25, p75 and headcount, plus job-title and department breakdowns |
| GET | `/insights/job_title?country=IN&job_title=Data%20Scientist` | Average for one title in one country, compared with the country average |
| GET | `/meta/filters` | Distinct countries, job titles, departments and employment types |

Errors are JSON: `404 {error}`, `400 {error}` for missing or invalid params, and `422 {errors: {field: [messages]}}`.

## Project layout (a standard Rails app)

```
app/
  controllers/home_controller.rb    serves the React app shell (any HTML route)
  controllers/api/v1/               JSON API (thin controllers)
  models/employee.rb                validations, normalization, scopes
  queries/employees_query.rb        filter, search, sort whitelist, pagination
  services/salary_insights.rb       analytics (SQL aggregates and percentiles)
  services/employee_seeder.rb       bulk, deterministic seeding
  serializers/                      explicit JSON contract
  views/layouts/application.html.erb  loads the Vite bundle
  frontend/                         React + TypeScript source
    entrypoints/application.tsx     Vite entrypoint
    pages/  components/  api/  hooks/  utils/   (with *.test.tsx alongside)
config/vite.json, vite.config.ts    Vite / vite_rails configuration
db/seed_data/                       first_names.txt, last_names.txt
spec/                               RSpec: models, queries, services, requests
docs/                               design artifacts
```

## Design artifacts

- [docs/PLAN.md](docs/PLAN.md): requirements mapped to features, and the TDD sequence
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): diagrams, data model and request flow
- [docs/TRADEOFFS.md](docs/TRADEOFFS.md): decisions and alternatives
- [docs/PERFORMANCE.md](docs/PERFORMANCE.md): seed benchmarks, index and EXPLAIN analysis
- [docs/AI_USAGE.md](docs/AI_USAGE.md): how AI was used and how its output was verified
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md): how to deploy
- [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md): walkthrough for the video demo
- [docs/PROMPTS.md](docs/PROMPTS.md): the prompts given to the AI tool, word for word

Each document is also available as a rendered PNG, with diagrams drawn, in [`docs/images/`](docs/images/). For example, [ARCHITECTURE.png](docs/images/ARCHITECTURE.png) and [PROMPTS.png](docs/images/PROMPTS.png).
