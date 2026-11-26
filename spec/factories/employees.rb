FactoryBot.define do
  factory :employee do
    first_name { "Ada" }
    last_name { "Lovelace" }
    sequence(:email) { |n| "employee#{n}@acme.test" }
    job_title { "Software Engineer" }
    department { "Engineering" }
    country { "IN" }
    salary { 100_000 }
    employment_type { :full_time }
    hire_date { Date.new(2022, 1, 15) }
  end
end
