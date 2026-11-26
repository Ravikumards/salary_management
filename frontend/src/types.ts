export type EmploymentType = 'full_time' | 'part_time' | 'contract'

export interface Employee {
  id: number
  first_name: string
  last_name: string
  full_name: string
  email: string
  job_title: string
  department: string
  country: string
  salary: number
  employment_type: EmploymentType
  hire_date: string
  created_at: string
  updated_at: string
}

export type EmployeeInput = Pick<
  Employee,
  'first_name' | 'last_name' | 'email' | 'job_title' | 'department' | 'country' | 'employment_type' | 'hire_date'
> & { salary: number | string }

export interface PageMeta {
  page: number
  per_page: number
  total: number
  total_pages: number
}

export interface EmployeeListParams {
  q?: string
  country?: string
  job_title?: string
  department?: string
  sort?: string
  direction?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

export interface FilterOptions {
  countries: string[]
  job_titles: string[]
  departments: string[]
  employment_types: EmploymentType[]
}

export interface CountrySummary {
  country: string
  headcount: number
  total_payroll: number
  min: number | null
  max: number | null
  average: number | null
  median: number | null
  p25: number | null
  p75: number | null
}

export interface JobTitleBreakdown {
  job_title: string
  headcount: number
  average: number
  min: number
  max: number
}

export interface DepartmentBreakdown {
  department: string
  headcount: number
  average: number
  total_payroll: number
}

export interface CountryInsights {
  summary: CountrySummary
  job_titles: JobTitleBreakdown[]
  departments: DepartmentBreakdown[]
}

export interface JobTitleInsight {
  country: string
  job_title: string
  headcount: number
  average: number | null
  min: number | null
  max: number | null
  country_average: number | null
  difference_from_country_average_pct: number | null
}

export interface Overview {
  headcount: number
  total_payroll: number
  average: number | null
  country_count: number
  countries: Array<{ country: string; headcount: number; min: number; max: number; average: number; total_payroll: number }>
  top_job_titles: Array<{ job_title: string; headcount: number; average: number }>
  employment_types: Partial<Record<EmploymentType, number>>
}
