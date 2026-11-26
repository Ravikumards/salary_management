# Allows the React frontend to call the API when served from a different origin.
# Configure with a comma-separated list, e.g. CORS_ORIGINS=https://salary.example.com
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(*ENV.fetch("CORS_ORIGINS", "http://localhost:5173").split(",").map(&:strip))
    resource "/api/*", headers: :any, methods: %i[get post patch put delete options head]
  end
end
