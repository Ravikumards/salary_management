# Serves the single-page React application shell. Everything else is JSON under /api/v1.
class HomeController < ActionController::Base
  layout "application"

  def index; end
end
