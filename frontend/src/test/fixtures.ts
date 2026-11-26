import type { Api } from '../api'
import type { Employee } from '../types'

export const employee = (overrides: Partial<Employee> = {}): Employee => ({
  id: 1,
  first_name: 'Ada',
  last_name: 'Lovelace',
  full_name: 'Ada Lovelace',
  email: 'ada@acme.test',
  job_title: 'Engineer',
  department: 'Engineering',
  country: 'GB',
  salary: 120000,
  employment_type: 'full_time',
  hire_date: '2020-01-01',
  created_at: '',
  updated_at: '',
  ...overrides,
})

export function mockApi(overrides: Partial<Api> = {}): Api {
  return {
    listEmployees: vi.fn().mockResolvedValue({
      data: [employee(), employee({ id: 2, first_name: 'Alan', last_name: 'Turing', full_name: 'Alan Turing', email: 'alan@acme.test', salary: 150000 })],
      meta: { page: 1, per_page: 25, total: 2, total_pages: 1 },
    }),
    createEmployee: vi.fn().mockResolvedValue(employee({ id: 3 })),
    updateEmployee: vi.fn().mockResolvedValue(employee()),
    deleteEmployee: vi.fn().mockResolvedValue(undefined),
    filterOptions: vi.fn().mockResolvedValue({
      countries: ['GB', 'IN'],
      job_titles: ['Engineer', 'Manager'],
      departments: ['Engineering'],
      employment_types: ['full_time', 'part_time', 'contract'],
    }),
    overview: vi.fn().mockResolvedValue({
      headcount: 10000,
      total_payroll: 950_000_000,
      average: 95000,
      country_count: 2,
      countries: [
        { country: 'IN', headcount: 6000, min: 20000, max: 90000, average: 40000, total_payroll: 240_000_000 },
        { country: 'GB', headcount: 4000, min: 50000, max: 200000, average: 110000, total_payroll: 440_000_000 },
      ],
      top_job_titles: [{ job_title: 'Engineering Manager', headcount: 300, average: 180000 }],
      employment_types: { full_time: 8500, part_time: 500, contract: 1000 },
    }),
    countryInsights: vi.fn().mockResolvedValue({
      summary: { country: 'IN', headcount: 6000, total_payroll: 240_000_000, min: 20000, max: 90000, average: 40000, median: 38000, p25: 30000, p75: 50000 },
      job_titles: [{ job_title: 'Manager', headcount: 100, average: 70000, min: 50000, max: 90000 }],
      departments: [{ department: 'Engineering', headcount: 3000, average: 45000, total_payroll: 135_000_000 }],
    }),
    jobTitleInsight: vi.fn().mockResolvedValue({
      country: 'IN', job_title: 'Manager', headcount: 100, average: 70000, min: 50000, max: 90000,
      country_average: 40000, difference_from_country_average_pct: 75,
    }),
    ...overrides,
  }
}
