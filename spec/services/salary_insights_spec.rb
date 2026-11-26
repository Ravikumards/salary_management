require "rails_helper"

RSpec.describe SalaryInsights do
  subject(:insights) { described_class.new }

  def hire(country:, job_title:, salary:, department: "Engineering", employment_type: :full_time)
    create(:employee, country:, job_title:, salary:, department:, employment_type:)
  end

  before do
    # India: 4 employees -> min 40k, max 100k, avg 65k, median 60k
    hire(country: "IN", job_title: "Engineer", salary: 40_000)
    hire(country: "IN", job_title: "Engineer", salary: 50_000)
    hire(country: "IN", job_title: "Manager",  salary: 70_000, department: "Operations")
    hire(country: "IN", job_title: "Manager",  salary: 100_000, department: "Operations", employment_type: :contract)
    # US: 2 employees
    hire(country: "US", job_title: "Engineer", salary: 150_000)
    hire(country: "US", job_title: "Designer", salary: 110_000, department: "Design", employment_type: :part_time)
  end

  describe "#country_summary" do
    it "returns min, max, average, median, percentiles, headcount and payroll" do
      expect(insights.country_summary("IN")).to eq(
        country: "IN", headcount: 4, total_payroll: 260_000.0,
        min: 40_000.0, max: 100_000.0, average: 65_000.0,
        median: 60_000.0, p25: 47_500.0, p75: 77_500.0
      )
    end

    it "accepts a lowercase country code" do
      expect(insights.country_summary("us")).to include(country: "US", headcount: 2, average: 130_000.0)
    end

    it "returns zero headcount and nil stats for a country with no employees" do
      expect(insights.country_summary("FR")).to eq(
        country: "FR", headcount: 0, total_payroll: 0.0,
        min: nil, max: nil, average: nil, median: nil, p25: nil, p75: nil
      )
    end
  end

  describe "#job_title_in_country" do
    it "returns the average salary for the job title in the country, with context" do
      expect(insights.job_title_in_country("IN", "Engineer")).to eq(
        country: "IN", job_title: "Engineer", headcount: 2,
        average: 45_000.0, min: 40_000.0, max: 50_000.0,
        country_average: 65_000.0, difference_from_country_average_pct: -30.77
      )
    end

    it "returns nil stats when nobody holds the title in that country" do
      expect(insights.job_title_in_country("US", "Manager")).to include(headcount: 0, average: nil, difference_from_country_average_pct: nil)
    end
  end

  describe "#job_titles_in_country" do
    it "breaks down salaries by job title, highest average first" do
      expect(insights.job_titles_in_country("IN")).to eq([
        { job_title: "Manager", headcount: 2, average: 85_000.0, min: 70_000.0, max: 100_000.0 },
        { job_title: "Engineer", headcount: 2, average: 45_000.0, min: 40_000.0, max: 50_000.0 }
      ])
    end
  end

  describe "#departments_in_country" do
    it "breaks down headcount and payroll by department" do
      expect(insights.departments_in_country("IN")).to eq([
        { department: "Operations", headcount: 2, average: 85_000.0, total_payroll: 170_000.0 },
        { department: "Engineering", headcount: 2, average: 45_000.0, total_payroll: 90_000.0 }
      ])
    end
  end

  describe "#overview" do
    subject(:overview) { insights.overview }

    it "summarizes the whole organization" do
      expect(overview).to include(headcount: 6, total_payroll: 520_000.0, average: 86_666.67, country_count: 2)
    end

    it "summarizes each country ordered by headcount" do
      expect(overview[:countries]).to eq([
        { country: "IN", headcount: 4, min: 40_000.0, max: 100_000.0, average: 65_000.0, total_payroll: 260_000.0 },
        { country: "US", headcount: 2, min: 110_000.0, max: 150_000.0, average: 130_000.0, total_payroll: 260_000.0 }
      ])
    end

    it "lists the top paying job titles org-wide" do
      expect(overview[:top_job_titles].first).to eq(job_title: "Designer", headcount: 1, average: 110_000.0)
      expect(overview[:top_job_titles].size).to be <= SalaryInsights::TOP_N
    end

    it "counts employees by employment type" do
      expect(overview[:employment_types]).to eq("full_time" => 4, "part_time" => 1, "contract" => 1)
    end
  end

  describe ".percentile" do
    it "interpolates linearly between ranks" do
      expect(described_class.percentile([ 10, 20, 30, 40 ], 0.5)).to eq(25.0)
      expect(described_class.percentile([ 10 ], 0.75)).to eq(10.0)
      expect(described_class.percentile([], 0.5)).to be_nil
    end
  end
end
