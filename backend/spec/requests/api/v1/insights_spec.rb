require "rails_helper"

RSpec.describe "Api::V1::Insights", type: :request do
  before do
    create(:employee, country: "IN", job_title: "Engineer", department: "Engineering", salary: 40_000)
    create(:employee, country: "IN", job_title: "Manager", department: "Operations", salary: 80_000)
    create(:employee, country: "US", job_title: "Engineer", department: "Engineering", salary: 150_000)
  end

  describe "GET /api/v1/insights/overview" do
    it "returns org-wide metrics" do
      get "/api/v1/insights/overview"

      expect(response).to have_http_status(:ok)
      expect(json["data"]).to include("headcount" => 3, "country_count" => 2, "total_payroll" => 270_000.0)
      expect(json["data"]["countries"].map { _1["country"] }).to eq(%w[IN US])
    end
  end

  describe "GET /api/v1/insights/countries/:country" do
    it "returns the country summary with job title and department breakdowns" do
      get "/api/v1/insights/countries/in"

      expect(response).to have_http_status(:ok)
      expect(json["data"]["summary"]).to include("country" => "IN", "min" => 40_000.0, "max" => 80_000.0, "average" => 60_000.0, "median" => 60_000.0)
      expect(json["data"]["job_titles"].map { _1["job_title"] }).to eq(%w[Manager Engineer])
      expect(json["data"]["departments"].map { _1["department"] }).to eq(%w[Operations Engineering])
    end

    it "rejects a malformed country code" do
      get "/api/v1/insights/countries/india"

      expect(response).to have_http_status(:bad_request)
    end
  end

  describe "GET /api/v1/insights/job_title" do
    it "returns the average salary of a job title in a country" do
      get "/api/v1/insights/job_title", params: { country: "IN", job_title: "Engineer" }

      expect(response).to have_http_status(:ok)
      expect(json["data"]).to include("country" => "IN", "job_title" => "Engineer", "average" => 40_000.0, "headcount" => 1)
    end

    it "requires both country and job_title" do
      get "/api/v1/insights/job_title", params: { country: "IN" }

      expect(response).to have_http_status(:bad_request)
      expect(json["error"]).to match(/job_title/)
    end
  end
end
