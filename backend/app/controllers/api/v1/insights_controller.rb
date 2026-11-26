module Api
  module V1
    class InsightsController < BaseController
      COUNTRY_CODE = /\A[a-zA-Z]{2}\z/

      def overview
        render json: { data: insights.overview }
      end

      def country
        code = validated_country(params[:country])
        render json: {
          data: {
            summary: insights.country_summary(code),
            job_titles: insights.job_titles_in_country(code),
            departments: insights.departments_in_country(code)
          }
        }
      end

      def job_title
        code = validated_country(params.require(:country))
        render json: { data: insights.job_title_in_country(code, params.require(:job_title)) }
      end

      private

      def insights
        @insights ||= SalaryInsights.new
      end

      def validated_country(value)
        raise ActionController::BadRequest, "country must be a 2-letter ISO code" unless value.to_s.match?(COUNTRY_CODE)

        value
      end
    end
  end
end
