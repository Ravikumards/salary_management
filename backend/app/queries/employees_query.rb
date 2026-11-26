# Encapsulates the list-screen query: filtering, free-text search,
# whitelisted sorting and bounded pagination.
class EmployeesQuery
  DEFAULT_PER_PAGE = 25
  MAX_PER_PAGE = 100
  SORTABLE_COLUMNS = %w[full_name job_title department country salary hire_date created_at].freeze
  DEFAULT_SORT = "full_name".freeze

  Result = Struct.new(:records, :meta, keyword_init: true)

  def initialize(params = {})
    @params = params.to_h.symbolize_keys
    @relation = Employee.all
  end

  def call
    scope = sort(search(filter(@relation)))
    total = scope.count
    records = scope.offset((page - 1) * per_page).limit(per_page).to_a

    Result.new(
      records: records,
      meta: { page: page, per_page: per_page, total: total, total_pages: (total.to_f / per_page).ceil }
    )
  end

  private

  def filter(scope)
    scope = scope.in_country(@params[:country]) if @params[:country].present?
    scope = scope.with_job_title(@params[:job_title]) if @params[:job_title].present?
    scope = scope.where(department: @params[:department]) if @params[:department].present?
    scope
  end

  def search(scope)
    term = @params[:q].to_s.strip
    return scope if term.empty?

    pattern = "%#{ActiveRecord::Base.sanitize_sql_like(term)}%"
    scope.where("employees.full_name LIKE :p OR employees.email LIKE :p", p: pattern)
  end

  def sort(scope)
    column = SORTABLE_COLUMNS.include?(@params[:sort].to_s) ? @params[:sort].to_s : DEFAULT_SORT
    direction = @params[:direction].to_s.downcase == "desc" ? :desc : :asc
    # Secondary order on id keeps pagination stable when sort values tie.
    scope.order(column => direction, id: :asc)
  end

  def page
    @page ||= [ @params[:page].to_i, 1 ].max
  end

  def per_page
    @per_page ||= begin
      value = @params[:per_page].to_i
      value.positive? ? [ value, MAX_PER_PAGE ].min : DEFAULT_PER_PAGE
    end
  end
end
