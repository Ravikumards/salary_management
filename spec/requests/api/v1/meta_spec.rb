require "rails_helper"

RSpec.describe "Api::V1::Meta", type: :request do
  it "returns distinct sorted filter options" do
    create(:employee, country: "US", job_title: "Engineer", department: "Engineering")
    create(:employee, country: "IN", job_title: "Designer", department: "Design")
    create(:employee, country: "IN", job_title: "Engineer", department: "Engineering")

    get "/api/v1/meta/filters"

    expect(response).to have_http_status(:ok)
    expect(json["data"]).to eq(
      "countries" => %w[IN US],
      "job_titles" => %w[Designer Engineer],
      "departments" => %w[Design Engineering],
      "employment_types" => %w[full_time part_time contract]
    )
  end
end
