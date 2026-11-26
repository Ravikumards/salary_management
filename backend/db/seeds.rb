# Seeds employees for local development and demos.
#
#   bin/rails db:seed                     # 10,000 employees (default)
#   SEED_COUNT=50000 bin/rails db:seed    # custom volume
#   SEED_RANDOM=7 bin/rails db:seed       # different (still deterministic) dataset
#
# Existing employees are replaced (TRUNCATE) so the script is safe to rerun.
count = Integer(ENV.fetch("SEED_COUNT", EmployeeSeeder::DEFAULT_COUNT))
random_seed = Integer(ENV.fetch("SEED_RANDOM", 42))

started = Process.clock_gettime(Process::CLOCK_MONOTONIC)
inserted = EmployeeSeeder.new(count:, random_seed:).call
elapsed = Process.clock_gettime(Process::CLOCK_MONOTONIC) - started

puts format("Seeded %<count>d employees in %<seconds>.2fs", count: inserted, seconds: elapsed)
