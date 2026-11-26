import type { EmployeeInput } from '../types'

export type FormErrors = Partial<Record<keyof EmployeeInput, string>>

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const COUNTRY = /^[A-Za-z]{2}$/
const MAX_SALARY = 100_000_000

// Mirrors the server-side Employee validations for fast feedback; the API remains the source of truth.
export function validateEmployee(input: EmployeeInput): FormErrors {
  const errors: FormErrors = {}
  const required: Array<keyof EmployeeInput> = ['first_name', 'last_name', 'email', 'job_title', 'department', 'country', 'salary', 'hire_date']

  required.forEach((field) => {
    if (String(input[field] ?? '').trim() === '') errors[field] = 'Required'
  })

  if (!errors.email && !EMAIL.test(input.email.trim())) errors.email = 'Enter a valid email address'
  if (!errors.country && !COUNTRY.test(input.country.trim())) errors.country = 'Use a 2-letter ISO code, e.g. IN'

  if (!errors.salary) {
    const salary = Number(input.salary)
    if (!Number.isFinite(salary) || salary <= 0) errors.salary = 'Salary must be a positive number'
    else if (salary >= MAX_SALARY) errors.salary = 'Salary is unrealistically high'
  }

  if (!errors.hire_date && input.hire_date > new Date().toISOString().slice(0, 10)) {
    errors.hire_date = "Hire date can't be in the future"
  }

  return errors
}
