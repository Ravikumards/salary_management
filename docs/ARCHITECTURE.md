# Architecture

## Components

A **single Rails web application** serves both the React UI and the JSON API from one process, one port and one deploy. The React source lives in `app/frontend/` and is bundled by Vite through `vite_rails`.

```mermaid
flowchart LR
  subgraph Browser
    UI[React SPA<br/>MUI components]
  end
  subgraph Rails["Rails 8.1 web application (one server)"]
    H[HomeController<br/>HTML shell + Vite bundle]
    C[API controllers<br/>/api/v1/*]
    Q[EmployeesQuery]
    S[SalaryInsights]
    Ser[EmployeeSerializer]
    M[Employee model]
    Seed[EmployeeSeeder]
  end
  DB[(MySQL<br/>employees)]

  UI -- "GET / (HTML + JS)" --> H
  UI -- "fetch /api/v1 (same origin JSON)" --> C
  C --> Q --> M
  C --> S --> M
  C --> Ser
  M --> DB
  Seed -- insert_all batches --> DB
```

Routing:
- `/` and any HTML deep link, such as `/insights`, render the app shell (`layouts/application.html.erb`).
- `/api/v1/*` returns JSON. Unknown API paths return a JSON 404 rather than the shell.
- `/up` is the health check.

Development: `bin/dev` runs Rails and the Vite dev server (hot reload) through `Procfile.dev`. Production: `assets:precompile` runs `vite build` into `public/vite/`, and Rails serves those files.

### Backend layering

| Layer | Responsibility | Why |
|---|---|---|
| Controllers (`Api::V1::*`) | Parse params, call one domain object, render | Thin and easy to test through request specs |
| `HomeController` | Renders the HTML shell that loads the React bundle (`vite_javascript_tag`) | Lets one app serve both UI and API |
| `BaseController` | `rescue_from` for 404, 400 and 422, and turns off implicit param wrapping | One consistent error contract |
| `EmployeesQuery` | Filter, search, sort and paginate | Keeps list-screen logic out of the model and controller. Unit tested without HTTP |
| `SalaryInsights` | All analytics | A single read-model service, so SQL aggregation can be optimized in one place |
| `EmployeeSerializer` | JSON shape | An explicit contract with no extra dependency |
| `EmployeeSeeder` | Bulk data generation | Reused by `db/seeds.rb` and tested directly |

### Frontend structure (`app/frontend/`)

- `entrypoints/application.tsx`: the Vite entrypoint that mounts `<App/>`.
- `api/client.ts`: a fetch wrapper that maps 422 responses to `ApiError.fieldErrors`, which the form shows inline.
- `hooks/useAsync.ts`: data loading that ignores stale responses, so fast typing or filtering never renders results out of order. It keeps the previous data while reloading, which avoids flicker.
- The pages take an `api` prop, defaulting to the real client. Tests inject mocks with no global fetch mocking or MSW, which keeps them fast and deterministic.
- Plain CSS bars and a box-plot strip instead of a charting library keep the bundle small.

## Data model

```mermaid
erDiagram
  EMPLOYEES {
    bigint id PK
    varchar first_name "NOT NULL, <=100"
    varchar last_name "NOT NULL, <=100"
    varchar full_name "derived, indexed"
    varchar email "NOT NULL, UNIQUE"
    varchar job_title "NOT NULL"
    varchar department "NOT NULL, indexed"
    char country "ISO-3166 alpha-2"
    decimal salary "12,2 annual USD"
    varchar employment_type "full_time | part_time | contract"
    date hire_date "not in future"
    datetime created_at
    datetime updated_at
  }
```

Indexes:
- `UNIQUE(email)`
- `(country, job_title, salary)`: a covering index for every country and country-plus-title aggregate
- `(job_title, salary)`: org-wide title rankings
- `(department)`
- `(full_name)`: sorting and paging the list

## Request flow: "Average Data Scientist salary in India"

```mermaid
sequenceDiagram
  participant U as HR Manager
  participant R as React (InsightsPage)
  participant A as InsightsController
  participant S as SalaryInsights
  participant D as MySQL
  U->>R: select country=IN, job title=Data Scientist
  R->>A: GET /api/v1/insights/job_title?country=IN&job_title=Data Scientist
  A->>A: validate country code (400 if malformed)
  A->>S: job_title_in_country("IN", "Data Scientist")
  S->>D: SELECT COUNT, MIN, MAX, AVG ... WHERE country=? AND job_title=? (covering index)
  S->>D: SELECT AVG ... WHERE country=? (covering index)
  S-->>A: {average, min, max, headcount, country_average, difference_pct}
  A-->>R: 200 JSON
  R-->>U: stat cards, e.g. "+30.37% vs. country average"
```
