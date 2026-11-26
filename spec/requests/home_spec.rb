require "rails_helper"

RSpec.describe "Web application shell", type: :request do
  it "serves the React app at the root" do
    get "/"

    expect(response).to have_http_status(:ok)
    expect(response.media_type).to eq("text/html")
    expect(response.body).to include('<div id="root"></div>')
    script = Nokogiri::HTML(response.body).at_css("script[type=module][src*='/assets/application-']")
    expect(script).to be_present
  end

  it "serves the app shell for client-side paths so deep links work" do
    get "/insights"

    expect(response).to have_http_status(:ok)
    expect(response.body).to include('<div id="root"></div>')
  end

  it "does not swallow unknown API routes" do
    get "/api/v1/nope"

    expect(response).to have_http_status(:not_found)
    expect(response.media_type).not_to eq("text/html")
  end
end
