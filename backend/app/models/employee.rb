class Employee < ApplicationRecord
  EMAIL_FORMAT = URI::MailTo::EMAIL_REGEXP
  MAX_SALARY = 100_000_000

  enum :employment_type, { full_time: "full_time", part_time: "part_time", contract: "contract" },
       validate: true

  normalizes :country, with: ->(value) { value.strip.upcase }
  normalizes :email, with: ->(value) { value.strip.downcase }
  normalizes :first_name, :last_name, :job_title, :department, with: ->(value) { value.squish }

  validates :first_name, :last_name, :job_title, :department, presence: true, length: { maximum: 100 }
  validates :email, presence: true, format: { with: EMAIL_FORMAT, allow_blank: true },
                    uniqueness: { case_sensitive: false }
  validates :country, presence: true, format: { with: /\A[A-Z]{2}\z/, message: "must be a 2-letter ISO code", allow_blank: true }
  validates :salary, presence: true, numericality: { greater_than: 0, less_than: MAX_SALARY }
  validates :hire_date, presence: true
  validate :hire_date_not_in_future

  before_save :assign_full_name

  scope :in_country, ->(code) { where(country: code.to_s.strip.upcase) }
  scope :with_job_title, ->(title) { where(job_title: title) }

  private

  def assign_full_name
    self.full_name = "#{first_name} #{last_name}"
  end

  def hire_date_not_in_future
    errors.add(:hire_date, "can't be in the future") if hire_date.present? && hire_date > Date.current
  end
end
