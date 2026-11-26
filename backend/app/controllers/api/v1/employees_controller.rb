module Api
  module V1
    class EmployeesController < BaseController
      PERMITTED = %i[first_name last_name email job_title department country salary employment_type hire_date].freeze
      FILTER_PARAMS = %i[q country job_title department sort direction page per_page].freeze

      before_action :set_employee, only: %i[show update destroy]

      def index
        result = EmployeesQuery.new(params.permit(*FILTER_PARAMS)).call
        render json: { data: EmployeeSerializer.collection(result.records), meta: result.meta }
      end

      def show
        render json: { data: EmployeeSerializer.call(@employee) }
      end

      def create
        employee = Employee.new(employee_params)
        if employee.save
          render json: { data: EmployeeSerializer.call(employee) }, status: :created
        else
          render_validation_errors(employee)
        end
      end

      def update
        if @employee.update(employee_params)
          render json: { data: EmployeeSerializer.call(@employee) }
        else
          render_validation_errors(@employee)
        end
      end

      def destroy
        @employee.destroy!
        head :no_content
      end

      private

      def set_employee
        @employee = Employee.find(params[:id])
      end

      def employee_params
        params.require(:employee).permit(*PERMITTED)
      end
    end
  end
end
