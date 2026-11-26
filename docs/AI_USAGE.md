# How AI was used

This solution was built with **Claude Code** (an agentic CLI) acting as a pair programmer. A human stayed in the loop to approve the plan and the decisions.

## Workflow

1. **Requirement intake:** the assessment PDF was given to the agent with this prompt:
   > "take this requirement, build ror application with mysql db, frontend react, follow test driven approach, build rspec, test it and also include artifacts as well"
2. **Plan first:** the agent produced a written plan, which the human approved before any feature code was written. It covered the data model, API surface, indexing strategy, seeder design, TDD order and what was out of scope. The approved plan became `docs/PLAN.md`.
3. **Red, then green, then commit:** for every backend unit, the agent wrote the spec first, ran it and confirmed it failed, then committed the red spec. It then implemented the unit, ran the full suite and committed the green result. `git log` shows this pattern.
4. **Verification beyond the tests:**
   - The API figures were compared with direct SQL on the 10k dataset. For India: headcount 2473, min 13,200, max 68,300 and avg 33,390.70. For Data Scientists in India: avg 43,533.12. Both matched exactly.
   - Every CRUD path was exercised with curl through the Vite proxy (201, 200, 422, 204 and 404).
   - Headless-Chrome screenshots were taken and visually reviewed (`docs/screenshots/`).
   - `EXPLAIN` confirmed covering-index usage, and the seeder was benchmarked against a naive loop.
   - Tooling: rubocop (clean), brakeman (one Ruby-version advisory, documented), oxlint (clean), and `tsc` through `npm run build`.

## Where AI output was corrected

These are examples of course-corrections caught by running the code rather than trusting it:

| Issue | How it was caught | Fix |
|---|---|---|
| `EmployeesQuery.new(country: "gb")` raised "unknown keyword" because Ruby 3 treated the hash as kwargs and they collided with a `relation:` keyword | The red-to-green run | Removed the unneeded keyword (YAGNI) |
| Rails `wrap_parameters` silently wrapped a root-less body, so "missing root → 400" never fired | A request spec | Disabled wrapping, for an explicit contract |
| A heredoc wrote to `app/services/` before the directory existed, so the file was silently missing | The suite still failed with "uninitialized constant" | Created the directory and rewrote the file |
| MUI v9 removed system props on `Stack` (`alignItems`, etc.) and renamed the `DeleteOutline` icon | `tsc` in `npm run build`, and a Vite import error | Moved the props to `sx` and used `DeleteOutlined` |
| setState-in-effect patterns (resetting the form, defaulting the country, the loading flag) | oxlint `react(set-state-in-effect)` | Remount by `key`, derive the value during render, and derive `loading` from a request key |
| Port 3000 was already taken by an unrelated local app, so the proxy returned someone else's error page | Manual end-to-end check | Ran this app on another port (`bin/rails s -p 3001`) and left the user's process alone |
| MySQL `TRUNCATE` commits implicitly, which would break transactional tests | Design review while writing the seeder spec | The seeder spec disables transactional tests and cleans up explicitly |
| The first version had a separate `backend/` API and a separate `frontend/` SPA. The reviewer pointed out that it should be **one web application** | Human review | Restructured into a single Rails app with `vite_rails`: React lives in `app/frontend/`, Rails serves the shell and the API, and CORS, nginx and the second Dockerfile are gone. The change was test-first: `spec/requests/home_spec.rb` was written red before the wiring |

## Guardrails used

- Specs have hand-computed expectations (for example, the p25 of [40k, 50k, 70k, 100k] is 47.5k). Expectations were never copied from implementation output.
- No secrets are committed (`master.key` is ignored), and production secrets come from environment variables.
- Generated code was kept to what the requirements need. There are no speculative abstractions or extra gems.
