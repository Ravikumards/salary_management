import { request } from './client'
import type {
  CountryInsights,
  Employee,
  EmployeeInput,
  EmployeeListParams,
  FilterOptions,
  JobTitleInsight,
  Overview,
  PageMeta,
} from '../types'

type Data<T> = { data: T }

export const api = {
  listEmployees: (params: EmployeeListParams) =>
    request<{ data: Employee[]; meta: PageMeta }>('/employees', { query: { ...params } }),
  createEmployee: (employee: EmployeeInput) =>
    request<Data<Employee>>('/employees', { method: 'POST', body: { employee } }).then((r) => r.data),
  updateEmployee: (id: number, employee: Partial<EmployeeInput>) =>
    request<Data<Employee>>(`/employees/${id}`, { method: 'PATCH', body: { employee } }).then((r) => r.data),
  deleteEmployee: (id: number) => request<void>(`/employees/${id}`, { method: 'DELETE' }),

  filterOptions: () => request<Data<FilterOptions>>('/meta/filters').then((r) => r.data),

  overview: () => request<Data<Overview>>('/insights/overview').then((r) => r.data),
  countryInsights: (country: string) =>
    request<Data<CountryInsights>>(`/insights/countries/${encodeURIComponent(country)}`).then((r) => r.data),
  jobTitleInsight: (country: string, jobTitle: string) =>
    request<Data<JobTitleInsight>>('/insights/job_title', { query: { country, job_title: jobTitle } }).then((r) => r.data),
}

export type Api = typeof api
