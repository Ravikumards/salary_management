require "rails_helper"

RSpec.describe "Api::V1::Employees", type: :request do
  let(:valid_attributes) do
    {
      first_name: "Grace", last_name: "Hopper", email: "grace@acme.test",
      job_title: "Engineer", department: "Engineering", country: "US",
      salary: 180_000, employment_type: "full_time", hire_date: "2020-03-01"
    }
  end

  describe "GET /api/v1/employees" do
    before do
      create(:employee, first_name: "Ada", country: "GB")
      create(:employee, first_name: "Linus", country: "FI")
    end

    it "returns a paginated list with meta" do
      get "/api/v1/employees", params: { per_page: 1 }

      expect(response).to have_http_status(:ok)
      expect(json["data"].size).to eq(1)
      expect(json["meta"]).to eq("page" => 1, "per_page" => 1, "total" => 2, "total_pages" => 2)
    end

    it "applies filters" do
      get "/api/v1/employees", params: { country: "FI" }

      expect(json["data"].map { _1["first_name"] }).to eq([ "Linus" ])
    end

    it "serializes the employee fields" do
      get "/api/v1/employees", params: { country: "GB" }

      expect(json["data"].first.keys).to match_array(
        %w[id first_name last_name full_name email job_title department country salary employment_type hire_date created_at updated_at]
      )
      expect(json["data"].first["salary"]).to eq(100_000.0)
    end
  end

  describe "GET /api/v1/employees/:id" do
    it "returns the employee" do
      employee = create(:employee)

      get "/api/v1/employees/#{employee.id}"

      expect(response).to have_http_status(:ok)
      expect(json["data"]["id"]).to eq(employee.id)
    end

    it "returns 404 for an unknown id" do
      get "/api/v1/employees/0"

      expect(response).to have_http_status(:not_found)
      expect(json["error"]).to eq("Employee not found")
    end
  end

  describe "POST /api/v1/employees" do
    it "creates an employee" do
      expect {
        post "/api/v1/employees", params: { employee: valid_attributes }, as: :json
      }.to change(Employee, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(json["data"]).to include("full_name" => "Grace Hopper", "country" => "US", "salary" => 180_000.0)
    end

    it "returns 422 with field errors for invalid input" do
      post "/api/v1/employees", params: { employee: valid_attributes.merge(salary: -1, country: "") }, as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(json["errors"].keys).to include("salary", "country")
    end

    it "returns 422 for an unknown employment type" do
      post "/api/v1/employees", params: { employee: valid_attributes.merge(employment_type: "intern") }, as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(json["errors"]).to have_key("employment_type")
    end

    it "returns 400 when the employee root key is missing" do
      post "/api/v1/employees", params: { first_name: "x" }, as: :json

      expect(response).to have_http_status(:bad_request)
    end

    it "ignores non-permitted attributes" do
      post "/api/v1/employees", params: { employee: valid_attributes.merge(full_name: "Hacked", id: 999_999) }, as: :json

      expect(json["data"]["full_name"]).to eq("Grace Hopper")
      expect(json["data"]["id"]).not_to eq(999_999)
    end
  end

  describe "PATCH /api/v1/employees/:id" do
    let(:employee) { create(:employee) }

    it "updates the employee" do
      patch "/api/v1/employees/#{employee.id}", params: { employee: { salary: 125_000, job_title: "Staff Engineer" } }, as: :json

      expect(response).to have_http_status(:ok)
      expect(employee.reload).to have_attributes(salary: 125_000, job_title: "Staff Engineer")
    end

    it "returns 422 for invalid updates" do
      patch "/api/v1/employees/#{employee.id}", params: { employee: { email: "bad" } }, as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(json["errors"]).to have_key("email")
    end
  end

  describe "DELETE /api/v1/employees/:id" do
    it "deletes the employee" do
      employee = create(:employee)

      expect {
        delete "/api/v1/employees/#{employee.id}"
      }.to change(Employee, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end

    it "returns 404 for an unknown id" do
      delete "/api/v1/employees/0"

      expect(response).to have_http_status(:not_found)
    end
  end
end
