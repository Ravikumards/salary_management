# Plain-Ruby serializer: explicit, fast, and keeps the API contract in one place.
class EmployeeSerializer
  ATTRIBUTES = %i[id first_name last_name full_name email job_title department country
                  employment_type hire_date created_at updated_at].freeze

  def self.call(employee)
    employee.slice(*ATTRIBUTES).merge("salary" => employee.salary.to_f)
  end

  def self.collection(employees)
    employees.map { |employee| call(employee) }
  end
end
