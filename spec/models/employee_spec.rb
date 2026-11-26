require "rails_helper"

RSpec.describe Employee, type: :model do
  subject(:employee) { build(:employee) }

  describe "validations" do
    it { is_expected.to be_valid }

    %i[first_name last_name job_title department country salary hire_date email].each do |attr|
      it { is_expected.to validate_presence_of(attr) }
    end

    it { is_expected.to validate_length_of(:first_name).is_at_most(100) }
    it { is_expected.to validate_length_of(:last_name).is_at_most(100) }
    it { is_expected.to validate_length_of(:job_title).is_at_most(100) }

    it { is_expected.to validate_numericality_of(:salary).is_greater_than(0).is_less_than(100_000_000) }

    it "requires a well formed email" do
      employee.email = "not-an-email"
      expect(employee).not_to be_valid
      expect(employee.errors[:email]).to be_present
    end

    it "requires a unique email, case-insensitively" do
      create(:employee, email: "dup@acme.test")
      employee.email = "DUP@acme.test"
      expect(employee).not_to be_valid
      expect(employee.errors[:email]).to include("has already been taken")
    end

    it "requires country to be a 2-letter ISO code" do
      employee.country = "India"
      expect(employee).not_to be_valid
      expect(employee.errors[:country]).to be_present
    end

    it "rejects hire dates in the future" do
      employee.hire_date = Date.current + 1
      expect(employee).not_to be_valid
      expect(employee.errors[:hire_date]).to include("can't be in the future")
    end

    it do
      is_expected.to define_enum_for(:employment_type)
        .with_values(full_time: "full_time", part_time: "part_time", contract: "contract")
        .backed_by_column_of_type(:string)
        .with_prefix(false)
    end
  end

  describe "normalization" do
    it "upcases and strips the country code" do
      employee.country = " in "
      expect(employee.country).to eq("IN")
    end

    it "downcases and strips the email" do
      employee.email = "  Ada@ACME.test "
      expect(employee.email).to eq("ada@acme.test")
    end

    it "squishes name and job title whitespace" do
      employee.first_name = "  Ada  "
      employee.job_title = " Senior   Engineer "
      expect(employee.first_name).to eq("Ada")
      expect(employee.job_title).to eq("Senior Engineer")
    end
  end

  describe "#full_name" do
    it "is derived from first and last name on save" do
      employee.save!
      expect(employee.reload.full_name).to eq("Ada Lovelace")
    end

    it "is updated when the name changes" do
      employee.save!
      employee.update!(last_name: "Byron")
      expect(employee.reload.full_name).to eq("Ada Byron")
    end
  end

  describe "scopes" do
    let!(:india) { create(:employee, country: "IN", job_title: "Engineer") }
    let!(:us) { create(:employee, country: "US", job_title: "Designer") }

    it ".in_country filters by country code (case-insensitive input)" do
      expect(Employee.in_country("in")).to contain_exactly(india)
    end

    it ".with_job_title filters by exact job title" do
      expect(Employee.with_job_title("Designer")).to contain_exactly(us)
    end
  end
end
