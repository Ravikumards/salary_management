# Prompts used with the AI tool

The tool was **Claude Code**, an agentic CLI. These are the prompts given to it, word for word and in order, with what each led to. The local file path is shortened to `~/Downloads/`.

---

### Prompt 1: build the solution

> `~/Downloads/Salary Management Assessment.pdf` --- take this requirement, build ror application with mysql db,frontend react, follow test driven approach, build rspec, test it and also include artifacts as well

*(Sent twice: the first run was interrupted after scaffolding, and the same prompt was sent again to continue.)*

**How the agent handled it**
1. Read the PDF and pulled out the requirements:
   - CRUD for employees
   - Salary insights by country, and by job title within a country
   - A seed script for 10k employees, with performance in mind
   - Tests and incremental commits
   - Artifacts
2. Checked the local toolchain (Ruby 3.3, Rails 8.1, MySQL, Node), then scaffolded a Rails API with MySQL and RSpec.
3. **Plan mode:** wrote an implementation plan for the human to approve. It covered:
   - The data model and indexes
   - The API surface
   - The service and query objects
   - The seeder design
   - The TDD order
   - What was out of scope

   The approved plan is captured in [PLAN.md](PLAN.md).
4. Ran the TDD loop for each unit: write the spec, see it fail, commit (red); implement, see the suite pass, commit (green).
5. Verified the result outside the tests:
   - Compared the API figures with direct SQL
   - Exercised CRUD with curl
   - Took headless-browser screenshots
   - Ran `EXPLAIN` on the insights queries
   - Benchmarked the seeder
6. Wrote the artifacts in `docs/`.

### Prompt 2: plan approval

> *(Approved the plan in Claude Code's plan-mode UI)*

### Prompt 3: architecture correction

> it should be web application ryt, code looks seperate

**How the agent handled it.** The first version had a separate `backend/` API and a separate `frontend/` SPA. The agent:
- Merged them into **one Rails web application** using `vite_rails`, moving React into `app/frontend/`. Rails now serves the HTML shell and the `/api/v1` JSON.
- Removed CORS, nginx and the second Dockerfile.
- Moved files with `git mv`, which preserved their history.
- Wrote the request spec for the shell first (`spec/requests/home_spec.rb`).
- Re-verified the app in dev mode (Vite HMR) and production mode (`assets:precompile`).

### Prompt 4: artifacts

> convert doc md to png, also add prompt in file

**How the agent handled it.**
- Added this file.
- Rendered every Markdown document in `docs/` to a PNG in `docs/images/`, with Mermaid diagrams drawn. The rendering used headless Chrome and a throwaway renderer outside the repository.

---

## Instructions the agent followed throughout

These are the agent's working rules, implied by Prompt 1 and the assessment brief:

- **Test first:** commit failing specs before the implementation. Specs use hand-computed expected values, never values copied from implementation output.
- **Small, incremental commits** with descriptive messages, so the history shows how the solution evolved.
- **Verify, don't trust:** run the suite, linters and type-checker after every change, and check numbers against the database.
- **Minimal dependencies:** add a gem or npm package only when it clearly earns its place.
- **Don't touch unrelated local processes or files.** For example, another app was already using port 3000, so this app used a different port.
- **Never commit secrets** (`config/master.key` is git-ignored).
