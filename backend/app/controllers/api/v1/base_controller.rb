module Api
  module V1
    class BaseController < ApplicationController
      # Require an explicit resource root key (e.g. { employee: {...} }) for a predictable contract.
      wrap_parameters false

      rescue_from ActiveRecord::RecordNotFound do |e|
        render json: { error: "#{e.model || 'Record'} not found" }, status: :not_found
      end

      rescue_from ActionController::ParameterMissing do |e|
        render json: { error: e.message }, status: :bad_request
      end

      private

      def render_validation_errors(record)
        render json: { errors: record.errors.to_hash(true) }, status: :unprocessable_content
      end
    end
  end
end
