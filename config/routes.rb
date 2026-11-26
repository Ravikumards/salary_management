Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      resources :employees, only: %i[index show create update destroy]

      scope :insights, controller: :insights, as: :insights do
        get :overview
        get :job_title
        get "countries/:country", action: :country, as: :country
      end

      get "meta/filters", to: "meta#filters"
    end

    # Unknown API paths return JSON 404s rather than the HTML app shell.
    match "*path", to: "v1/base#route_not_found", via: :all
  end

  root "home#index"
  # Client-side routes (e.g. /insights) render the same shell so deep links and refreshes work.
  get "*path", to: "home#index", constraints: ->(req) { req.format.html? }
end
