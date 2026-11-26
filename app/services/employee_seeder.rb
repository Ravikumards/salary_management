# Fast, deterministic bulk seeding of employees.
#
# Performance choices (engineers run this regularly):
# * Name files are read once; rows are built as plain hashes in memory.
# * Rows are written with `insert_all` in batches (one multi-row INSERT per batch),
#   skipping per-record validations, callbacks and object instantiation.
# * All batches run inside a single transaction to avoid per-statement commits.
# * The table is TRUNCATEd (O(1)) rather than DELETEd row by row.
#
# Correctness is preserved by generating only values that satisfy Employee
# validations (verified in spec/services/employee_seeder_spec.rb).
class EmployeeSeeder
  DEFAULT_COUNT = 10_000
  DEFAULT_BATCH_SIZE = 2_000
  EMAIL_DOMAIN = "acme.example".freeze
  HIRE_DATE_RANGE_START = Date.new(2012, 1, 1)
  HIRE_DATE_RANGE_DAYS = 4_750 # up to ~Jan 2025, fixed so output is deterministic

  # Annual USD salary multiplier relative to a US baseline, and relative headcount weight.
  COUNTRIES = {
    "US" => { factor: 1.00, weight: 30 }, "IN" => { factor: 0.30, weight: 25 },
    "GB" => { factor: 0.80, weight: 10 }, "DE" => { factor: 0.85, weight: 8 },
    "CA" => { factor: 0.80, weight: 7 },  "AU" => { factor: 0.82, weight: 5 },
    "SG" => { factor: 0.90, weight: 5 },  "BR" => { factor: 0.35, weight: 4 },
    "JP" => { factor: 0.70, weight: 3 },  "FR" => { factor: 0.78, weight: 3 }
  }.freeze

  # job title => [department, US baseline annual salary]
  JOB_TITLES = {
    "Software Engineer" => [ "Engineering", 130_000 ],
    "Senior Software Engineer" => [ "Engineering", 165_000 ],
    "Engineering Manager" => [ "Engineering", 190_000 ],
    "QA Engineer" => [ "Engineering", 100_000 ],
    "Data Scientist" => [ "Data", 145_000 ],
    "Data Analyst" => [ "Data", 95_000 ],
    "Product Manager" => [ "Product", 150_000 ],
    "Product Designer" => [ "Design", 120_000 ],
    "Sales Executive" => [ "Sales", 85_000 ],
    "Account Manager" => [ "Sales", 95_000 ],
    "Marketing Specialist" => [ "Marketing", 80_000 ],
    "HR Generalist" => [ "People", 75_000 ],
    "Recruiter" => [ "People", 78_000 ],
    "Financial Analyst" => [ "Finance", 98_000 ],
    "Customer Support Specialist" => [ "Support", 55_000 ],
    "Operations Manager" => [ "Operations", 110_000 ]
  }.freeze

  EMPLOYMENT_TYPES = [ [ "full_time", 85 ], [ "part_time", 5 ], [ "contract", 10 ] ].freeze

  def initialize(count: DEFAULT_COUNT,
                 first_names_path: Rails.root.join("db/seed_data/first_names.txt"),
                 last_names_path: Rails.root.join("db/seed_data/last_names.txt"),
                 batch_size: DEFAULT_BATCH_SIZE,
                 random_seed: 42,
                 reset: true,
                 email_offset: 0)
    @count = Integer(count)
    @first_names = load_names(first_names_path)
    @last_names = load_names(last_names_path)
    @batch_size = Integer(batch_size)
    @random = Random.new(random_seed)
    @reset = reset
    @email_offset = email_offset
    @country_pool = weighted_pool(COUNTRIES.transform_values { _1[:weight] })
    @employment_type_pool = weighted_pool(EMPLOYMENT_TYPES.to_h)
    @job_titles = JOB_TITLES.keys
  end

  # Returns the number of employees inserted.
  def call
    Employee.connection.truncate(Employee.table_name) if @reset

    now = Time.current
    Employee.transaction do
      (0...@count).each_slice(@batch_size) do |indexes|
        Employee.insert_all!(indexes.map { |i| build_row(i + @email_offset, now) }, record_timestamps: false)
      end
    end

    @count
  end

  private

  def build_row(index, now)
    first_name = @first_names.sample(random: @random)
    last_name = @last_names.sample(random: @random)
    country = @country_pool.sample(random: @random)
    job_title = @job_titles.sample(random: @random)
    department, base_salary = JOB_TITLES.fetch(job_title)

    {
      first_name: first_name,
      last_name: last_name,
      full_name: "#{first_name} #{last_name}",
      email: "#{first_name}.#{last_name}.#{index + 1}@#{EMAIL_DOMAIN}".downcase,
      job_title: job_title,
      department: department,
      country: country,
      salary: salary_for(base_salary, country),
      employment_type: @employment_type_pool.sample(random: @random),
      hire_date: HIRE_DATE_RANGE_START + @random.rand(HIRE_DATE_RANGE_DAYS),
      created_at: now,
      updated_at: now
    }
  end

  # Baseline x country factor x +/-20% individual variance, rounded to the nearest 100.
  def salary_for(base_salary, country)
    variance = 0.8 + (@random.rand * 0.4)
    ((base_salary * COUNTRIES.fetch(country)[:factor] * variance) / 100).round * 100
  end

  def load_names(path)
    names = File.readlines(path, chomp: true).map(&:strip).reject(&:empty?).uniq
    raise ArgumentError, "no names found in #{path}" if names.empty?

    names
  end

  # Expands {value => weight} into an array so sampling is O(1) and deterministic.
  def weighted_pool(weights)
    weights.flat_map { |value, weight| [ value ] * weight }
  end
end
