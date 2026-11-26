# Plan

## Problem framing

The persona is an **HR Manager** who has to answer two kinds of question quickly:

1. **Operational:** "Add this new hire", "Fix this person's title", "Remove a leaver", "Find Priya in India".
2. **Analytical:** "What do we pay in India?", "What does a Data Scientist earn in India compared with the rest of the country?", "Where is our payroll concentrated?"

The org has 10k employees, so the list must be server-paginated and searchable. The insights must be computed in the database, not in the browser.

## Requirements mapped to features

| Requirement | Implementation |
|---|---|
| 1a. Add, view, update and delete employees through the UI | Employees page: table, Add/Edit dialog and delete confirmation. Backed by REST `/api/v1/employees` |
| 1b. Full name, job title, country and salary, plus other useful data | Also stores `email` (unique contact and identity), `department` (org structure for reporting), `employment_type` (full-time, part-time or contract; affects how comparable pay is) and `hire_date` (tenure). `full_name` is derived from first and last name |
| 2a. Min, max and average salary in a country | Insights page, country card. `GET /insights/countries/:country` |
| 2b. Average salary for a job title in a country | Insights page, "Job title in country" card. `GET /insights/job_title` |
| 2c. Other useful metrics | Median, p25 and p75 (a salary-spread strip), headcount, payroll, job-title and department breakdowns, a comparison across countries, the highest-paying titles, employment mix, and a job title's % difference from the country average |
| Seed 10k employees from first_names.txt and last_names.txt, with performance in mind | `EmployeeSeeder`: `insert_all` batches, a single transaction, TRUNCATE and a seeded RNG. About 0.9s for 10k |
| Unit tests that are fast, deterministic and easy to understand | 80 RSpec examples (about 1s) and 32 Vitest tests. Known datasets with exact expected numbers, and no network in the UI tests |
| Incremental commits | A red commit (spec) then a green commit (implementation) for each backend unit. See `git log` |

## TDD sequence followed

Each step was committed as a **red** test-only commit, then a **green** implementation commit.

1. `Employee` model: validations, normalization, derived `full_name` and scopes
2. `EmployeesQuery`: filters, search with literal wildcards, sort whitelist (SQL-injection safe) and pagination bounds
3. Employees API: request specs for 200, 201, 204, 400, 404 and 422, including strong-params checks
4. `SalaryInsights`: hand-computed fixture dataset (min, max, avg, median, p25 and p75 verified by hand)
5. Insights and Meta API
6. `EmployeeSeeder`: row count, names taken from the files, model-valid rows, unique emails, determinism and idempotency
7. Frontend: utilities and validation, then the form dialog, then the pages, each with a mocked, injected API

## Out of scope (deliberately)

- **Authentication and authorization:** a single persona, but it would be the next step (SSO or Devise, plus role-based access to salary data).
- **Multi-currency:** salaries are stored in annual USD (see TRADEOFFS.md).
- **Audit trail and salary history:** important for real HR use; this would be an `employee_salary_changes` table.
- **Bulk CSV import and export.**
