module Api
  module V1
    class MetaController < BaseController
      def filters
        render json: {
          data: {
            countries: distinct(:country),
            job_titles: distinct(:job_title),
            departments: distinct(:department),
            employment_types: Employee.employment_types.keys
          }
        }
      end

      private

      def distinct(column)
        Employee.distinct.order(column).pluck(column)
      end
    end
  end
end
