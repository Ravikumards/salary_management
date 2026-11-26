# Trade-offs and decisions

| Decision | Chosen | Alternatives | Why |
|---|---|---|---|
| App shape | **One Rails web app**, with React bundled by `vite_rails` | A separate API and SPA (two deploys, CORS) | One codebase, deploy and origin. No CORS and no proxy. HMR in development through `bin/dev`. The API stays a clean `/api/v1` JSON boundary, so a mobile client could use it later. |
| Salary currency | Store **annual USD** in `decimal(12,2)` | Local currency plus a `currency` column and FX table | Country comparisons and averages are correct only in one currency. Multi-currency adds FX rates, rate dates and rounding policy, which is out of scope for a minimal tool. The next step would be a `salary_local` and `currency` pair with a daily FX table, keeping USD as the reporting currency. |
| Money type | `DECIMAL`, serialized as JSON number | Integer cents, or string | Exact in the database. A JSON number is convenient for the UI, and values stay under 1e8, far inside the exactly representable range of a float. |
| Country | ISO-3166 alpha-2 code, validated | Countries table with a foreign key | Codes are stable and compact, and `Intl.DisplayNames` renders names in the UI for free. |
| Job title and department | Free text, with UI autocomplete from existing values | Lookup tables | Lower friction for HR. Autocomplete keeps the data consistent enough. Normalization (`squish`) avoids duplicates that differ only in whitespace. With more time: a managed taxonomy. |
| `full_name` | Stored, derived in `before_save` | Computed on read | Allows an indexed sort and a simple LIKE search across both names. |
| Median and percentiles | `pluck` sorted salaries for one country, computed in Ruby | MySQL window functions (`PERCENT_RANK`), or precomputed stats | At most about 10k decimals per request (around 1ms). Simple, portable and unit tested. At 1M+ rows, switch to window functions or a nightly materialized summary table. |
| Aggregates | Live SQL on covering indexes | Cache, or summary tables | About 30ms per insights call at 10k rows, always consistent with CRUD. Caching can be added later with cache keys based on `Employee.maximum(:updated_at)`. |
| Search | `LIKE '%term%'` on `full_name` and `email` | MySQL FULLTEXT, or Elasticsearch | A substring match is what users expect, and a 10k-row scan takes milliseconds. FULLTEXT does not do substring matching. Revisit at 1M+ rows. |
| Pagination | Offset, max 100 per page | Keyset (cursor) | Offset supports page jumping (MUI TablePagination) and costs little at this size. Secondary order on `id` keeps pages stable. |
| Seeding | `insert_all` batches, skipping validations | `create!` per row, or activerecord-import | About 40x faster (see PERFORMANCE.md). Skipping validations is safe because the generator only emits valid values, and a spec checks that every seeded row passes `valid?`. |
| Seeding reset | `TRUNCATE` | `delete_all` | O(1), and it resets auto-increment. Downside: MySQL commits implicitly, so the seeder spec disables transactional tests and cleans up explicitly. |
| Serializer | Plain Ruby | jbuilder, AMS or Blueprinter | One resource, so a gem adds more than it saves. |
| Param wrapping | Disabled, so `{employee: {...}}` is required | Rails' implicit `wrap_parameters` | An explicit, predictable contract, and a missing root returns 400. |
| Routing in the UI | Hash-based tabs | react-router | Two views. Deep links (`#insights`) still work. |
| Charts | CSS bars and a box-plot strip | Recharts or MUI X Charts | About 0 KB extra, accessible (`role="img"` with labels) and enough for comparisons. |
| UI tests | Injected API mock | MSW or Cypress | Fast (under 2s), deterministic and focused on behaviour. Request specs cover the real API contract. |
| Auth | None | Devise, or OIDC SSO | Out of scope for the assessment. In production, salary data must sit behind SSO and role-based access. |

## Known limitations and next steps

- The local dev Ruby (3.3.11) triggers a brakeman advisory (CVE-2026-132825). Upgrade to 3.3.14+ (the Docker image uses the latest 3.3).
- No audit log or salary history. HR systems need "who changed what, when".
- No soft delete. A leaver should be "terminated", not hard deleted, so that historic reports stay intact.
- The bundle is about 183 KB gzipped and the Vite build warns about the chunk size. It could be code-split per page.
