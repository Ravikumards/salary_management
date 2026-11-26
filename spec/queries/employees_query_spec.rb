require "rails_helper"

RSpec.describe EmployeesQuery do
  subject(:result) { described_class.new(params).call }

  let!(:ada)   { create(:employee, first_name: "Ada", last_name: "Lovelace", email: "ada@acme.test", country: "GB", job_title: "Engineer", department: "Engineering", salary: 120_000) }
  let!(:alan)  { create(:employee, first_name: "Alan", last_name: "Turing", email: "alan@acme.test", country: "GB", job_title: "Researcher", department: "Research", salary: 150_000) }
  let!(:grace) { create(:employee, first_name: "Grace", last_name: "Hopper", email: "grace@acme.test", country: "US", job_title: "Engineer", department: "Engineering", salary: 180_000) }

  context "with no params" do
    let(:params) { {} }

    it "returns all employees ordered by full name" do
      expect(result.records).to eq([ ada, alan, grace ])
    end

    it "returns default pagination meta" do
      expect(result.meta).to eq(page: 1, per_page: 25, total: 3, total_pages: 1)
    end
  end

  describe "filtering" do
    it "filters by country (case-insensitive)" do
      expect(described_class.new(country: "gb").call.records).to contain_exactly(ada, alan)
    end

    it "filters by job title" do
      expect(described_class.new(job_title: "Engineer").call.records).to contain_exactly(ada, grace)
    end

    it "filters by department" do
      expect(described_class.new(department: "Research").call.records).to contain_exactly(alan)
    end

    it "combines filters" do
      expect(described_class.new(country: "GB", job_title: "Engineer").call.records).to contain_exactly(ada)
    end

    it "ignores blank filters" do
      expect(described_class.new(country: "", job_title: nil).call.records.size).to eq(3)
    end
  end

  describe "search" do
    it "matches a name substring" do
      expect(described_class.new(q: "hop").call.records).to contain_exactly(grace)
    end

    it "matches an email substring" do
      expect(described_class.new(q: "alan@").call.records).to contain_exactly(alan)
    end

    it "treats SQL wildcards literally" do
      expect(described_class.new(q: "%").call.records).to be_empty
    end
  end

  describe "sorting" do
    it "sorts by a whitelisted column and direction" do
      expect(described_class.new(sort: "salary", direction: "desc").call.records).to eq([ grace, alan, ada ])
    end

    it "falls back to full_name asc for unknown columns" do
      expect(described_class.new(sort: "salary; DROP TABLE employees", direction: "sideways").call.records).to eq([ ada, alan, grace ])
    end
  end

  describe "pagination" do
    it "paginates with page and per_page" do
      result = described_class.new(page: 2, per_page: 2).call
      expect(result.records).to eq([ grace ])
      expect(result.meta).to eq(page: 2, per_page: 2, total: 3, total_pages: 2)
    end

    it "caps per_page at the maximum" do
      expect(described_class.new(per_page: 10_000).call.meta[:per_page]).to eq(EmployeesQuery::MAX_PER_PAGE)
    end

    it "coerces invalid page values to 1" do
      expect(described_class.new(page: "-3", per_page: "abc").call.meta).to include(page: 1, per_page: 25)
    end
  end
end
