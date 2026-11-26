# Read-only salary analytics for the HR persona.
#
# Aggregates (MIN/MAX/AVG/SUM/COUNT) are pushed down to MySQL and served by the
# composite (country, job_title, salary) index. Median/percentiles are computed in
# Ruby from a single sorted column pluck, which is cheap at the scale of one
# country (<= 10k rows) and avoids MySQL's lack of a PERCENTILE_CONT function.
class SalaryInsights
  TOP_N = 5

  def initialize(scope = Employee.all)
    @scope = scope
  end

  def self.percentile(sorted_values, fraction)
    return nil if sorted_values.empty?

    rank = fraction * (sorted_values.size - 1)
    lower = sorted_values[rank.floor]
    upper = sorted_values[rank.ceil]
    (lower + (upper - lower) * (rank - rank.floor)).to_f.round(2)
  end

  def country_summary(country)
    code = normalize_country(country)
    relation = @scope.in_country(code)
    stats = aggregate(relation)
    salaries = relation.order(:salary).pluck(:salary)

    {
      country: code,
      headcount: stats[:headcount],
      total_payroll: stats[:total_payroll],
      min: stats[:min],
      max: stats[:max],
      average: stats[:average],
      median: self.class.percentile(salaries, 0.5),
      p25: self.class.percentile(salaries, 0.25),
      p75: self.class.percentile(salaries, 0.75)
    }
  end

  def job_title_in_country(country, job_title)
    code = normalize_country(country)
    stats = aggregate(@scope.in_country(code).with_job_title(job_title))
    country_average = aggregate(@scope.in_country(code))[:average]

    {
      country: code,
      job_title: job_title,
      headcount: stats[:headcount],
      average: stats[:average],
      min: stats[:min],
      max: stats[:max],
      country_average: country_average,
      difference_from_country_average_pct: percent_difference(stats[:average], country_average)
    }
  end

  def job_titles_in_country(country)
    grouped(@scope.in_country(normalize_country(country)), :job_title).map do |row|
      { job_title: row.job_title, headcount: row.headcount, average: money(row.average),
        min: money(row.min_salary), max: money(row.max_salary) }
    end
  end

  def departments_in_country(country)
    grouped(@scope.in_country(normalize_country(country)), :department).map do |row|
      { department: row.department, headcount: row.headcount, average: money(row.average),
        total_payroll: money(row.total_payroll) }
    end
  end

  def overview
    stats = aggregate(@scope)
    countries = country_breakdown

    {
      headcount: stats[:headcount],
      total_payroll: stats[:total_payroll],
      average: stats[:average],
      country_count: countries.size,
      countries: countries,
      top_job_titles: top_job_titles,
      employment_types: @scope.group(:employment_type).count
    }
  end

  private

  def aggregate(relation)
    headcount, min, max, average, total = relation.pick(
      Arel.sql("COUNT(*)"), Arel.sql("MIN(salary)"), Arel.sql("MAX(salary)"),
      Arel.sql("AVG(salary)"), Arel.sql("COALESCE(SUM(salary), 0)")
    )

    { headcount: headcount.to_i, min: money(min), max: money(max), average: money(average), total_payroll: money(total) }
  end

  def grouped(relation, column)
    relation.unscope(:order)
            .group(column)
            .select(column, "COUNT(*) AS headcount", "AVG(salary) AS average", "MIN(salary) AS min_salary",
                    "MAX(salary) AS max_salary", "SUM(salary) AS total_payroll")
            .order(Arel.sql("average DESC"), column)
  end

  def country_breakdown
    grouped(@scope, :country).reorder(Arel.sql("headcount DESC"), :country).map do |row|
      { country: row.country, headcount: row.headcount, min: money(row.min_salary), max: money(row.max_salary),
        average: money(row.average), total_payroll: money(row.total_payroll) }
    end
  end

  def top_job_titles
    grouped(@scope, :job_title).limit(TOP_N).map do |row|
      { job_title: row.job_title, headcount: row.headcount, average: money(row.average) }
    end
  end

  def percent_difference(value, baseline)
    return nil if value.nil? || baseline.nil? || baseline.zero?

    ((value - baseline) / baseline * 100).round(2)
  end

  def money(value)
    value&.to_d&.round(2)&.to_f
  end

  def normalize_country(country)
    country.to_s.strip.upcase
  end
end
