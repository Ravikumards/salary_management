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
  end
end
