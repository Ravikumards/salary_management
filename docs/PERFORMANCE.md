# Performance

All numbers were measured locally on an Apple Silicon laptop running MySQL 9 (Homebrew), in Rails development mode.

## Seeding 10,000 employees

| Approach | Time for 10k | Notes |
|---|---|---|
| `Employee.create!` per row (naive) | **~35 s** (3.49 s for 1k, extrapolated) | Validations, a uniqueness SELECT, callbacks, one INSERT and one COMMIT per row |
| `EmployeeSeeder` (`insert_all!`, 2k-row batches, one transaction) | **0.85–0.88 s** (3 runs) | 5 multi-row INSERTs, 1 COMMIT |
| Total wall clock, `bin/rails db:seed` | ~1.4 s | Includes booting Rails |

What makes it fast:
1. **Batching:** one multi-row `INSERT` per 2,000 rows, so far fewer round trips and less parsing.
2. **A single transaction:** one fsync instead of 10k.
3. **No Active Record objects:** rows are plain hashes, with no validations or callbacks.
4. **TRUNCATE instead of DELETE:** clearing the table is O(1), and auto-increment resets, so reruns are reproducible.
5. **Weighted pools and a seeded `Random`:** O(1) sampling, and the same dataset every run (`SEED_RANDOM` changes it).

Correctness is kept despite skipping validations: `spec/services/employee_seeder_spec.rb` asserts that every seeded row is `valid?` and that emails are unique.

Scaling: `SEED_COUNT=100000 bin/rails db:seed` works without changes. Memory stays flat because only one batch of hashes is alive at a time.

## Insights queries

The `(country, job_title, salary)` index **covers** every insights query, so MySQL reads only the index and never touches table rows:

```
EXPLAIN SELECT COUNT(*),MIN(salary),MAX(salary),AVG(salary) FROM employees WHERE country='IN';
-> Aggregate ... -> Covering index lookup on employees using index_employees_on_country_and_job_title_and_salary (country = 'IN') (rows=2473)

EXPLAIN SELECT AVG(salary) FROM employees WHERE country='IN' AND job_title='Data Scientist';
-> Aggregate ... -> Covering index lookup ... (country = 'IN', job_title = 'Data Scientist') (rows=157)

EXPLAIN SELECT job_title, COUNT(*), AVG(salary) FROM employees WHERE country='IN' GROUP BY job_title;
-> Group aggregate ... -> Covering index lookup ... (country = 'IN')   # index order also avoids a filesort for GROUP BY
```

## API latency (10k rows, development mode, warm)

| Endpoint | Time |
|---|---|
| `GET /employees?per_page=25` | 10 ms |
| `GET /employees?q=pat&country=IN&sort=salary&direction=desc` | 25 ms |
| `GET /insights/overview` | 35 ms |
| `GET /insights/countries/US` | 35 ms |
| `GET /meta/filters` | 7 ms |

## Frontend

- Server-side pagination: the browser never holds more than 100 rows.
- Search is debounced by 300 ms, and stale responses are discarded in `useAsync`.
- Filter dropdowns use native `<select>`, which stays cheap with long option lists.
- Production bundle: about 183 KB gzipped (React plus MUI). The next step is per-page code-splitting.

## Tests

- RSpec: 80 examples in about 1 s, using transactional fixtures (the seeder spec is the only exception).
- Vitest: 32 tests in about 2 s, with no network.
