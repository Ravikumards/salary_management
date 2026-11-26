# Video demo script (about 5 minutes)

**Setup:** run `bin/rails db:seed` (10k employees), then run `bin/dev` and open http://localhost:3000. Have a terminal open next to the browser.

1. **Seeding (30s)**
   - Run `time bin/rails db:seed`. It prints "Seeded 10000 employees in ~0.9s".
   - Rerun it to show it is idempotent: the count is still 10,000.
2. **Employees list (60s)**
   - The header shows the count, "10,000 employees".
   - Type "patel" in search. Results narrow as you type (debounced).
   - Filter Country = India and Job title = Data Scientist.
   - Sort by Salary (descending). Page through results and change the rows per page.
3. **Add (45s)**
   - Click "Add employee". Submit the empty form to show the inline validation.
   - Enter an email that's already taken to show the server-side 422 error mapped onto the field.
   - Fix the fields and save. A toast appears and the row is visible.
4. **Edit and delete (30s)**
   - Edit the salary and save.
   - Delete the employee, confirm, and show the toast.
5. **Insights (90s)**
   - Org KPIs: headcount, payroll, average and contractor count.
   - The country card defaults to the largest country. Show min, median, average and max, and the middle-50% strip.
   - Switch to India.
   - "Job title in country": pick Data Scientist. Show the average, the range and "+30% vs. country average".
   - Pay by job title and department tables. Click a row in Countries compared to switch country.
6. **Code and tests (45s)**
   - Run `bundle exec rspec` (83 green, about 99% coverage) and `npm test` (32 green).
   - Show `git log --oneline`, with its red and green TDD commits.
   - Briefly show `docs/`.
