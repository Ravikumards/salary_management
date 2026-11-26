require "rails_helper"

RSpec.describe EmployeeSeeder do
  # TRUNCATE causes an implicit commit in MySQL, so this spec manages its own cleanup.
  self.use_transactional_tests = false
  after { Employee.delete_all }

  let(:first_names_path) { file_fixture("first_names.txt") }
  let(:last_names_path) { file_fixture("last_names.txt") }

  def seeder(**overrides)
    described_class.new(count: 25, first_names_path:, last_names_path:, batch_size: 10, random_seed: 7, **overrides)
  end

  it "inserts the requested number of employees across multiple batches" do
    expect(seeder.call).to eq(25)
    expect(Employee.count).to eq(25)
  end

  it "builds full names by combining first and last names from the files" do
    seeder.call

    Employee.find_each do |employee|
      expect(%w[Ada Alan Grace]).to include(employee.first_name)
      expect(%w[Lovelace Turing Hopper]).to include(employee.last_name)
      expect(employee.full_name).to eq("#{employee.first_name} #{employee.last_name}")
    end
  end

  it "produces records that satisfy model validations" do
    seeder.call

    expect(Employee.all.reject(&:valid?)).to be_empty
  end

  it "generates unique emails" do
    seeder.call

    expect(Employee.distinct.count(:email)).to eq(25)
  end

  it "is deterministic for a given random seed" do
    snapshot = -> { Employee.order(:email).pluck(:full_name, :email, :country, :job_title, :salary, :hire_date) }

    seeder.call
    first_run = snapshot.call
    seeder.call

    expect(snapshot.call).to eq(first_run)
  end

  it "replaces existing data so reruns are idempotent" do
    seeder.call
    seeder.call

    expect(Employee.count).to eq(25)
  end

  it "can append without clearing existing employees" do
    seeder.call
    seeder(reset: false, random_seed: 8, email_offset: 25).call

    expect(Employee.count).to eq(50)
  end

  it "raises a helpful error when a names file is empty" do
    empty = Rails.root.join("tmp/empty_names.txt").tap { |path| File.write(path, "\n") }

    expect { seeder(first_names_path: empty).call }.to raise_error(ArgumentError, /no names found/)
  end
end
