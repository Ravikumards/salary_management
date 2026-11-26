import { validateEmployee } from './validation'
import type { EmployeeInput } from '../types'

const valid: EmployeeInput = {
  first_name: 'Ada',
  last_name: 'Lovelace',
  email: 'ada@acme.test',
  job_title: 'Engineer',
  department: 'Engineering',
  country: 'GB',
  salary: '120000',
  employment_type: 'full_time',
  hire_date: '2020-01-01',
}

describe('validateEmployee', () => {
  it('returns no errors for a valid employee', () => {
    expect(validateEmployee(valid)).toEqual({})
  })

  it('requires the mandatory fields', () => {
    const errors = validateEmployee({ ...valid, first_name: ' ', job_title: '', country: '', salary: '' })
    expect(Object.keys(errors)).toEqual(expect.arrayContaining(['first_name', 'job_title', 'country', 'salary']))
  })

  it('rejects non-positive or non-numeric salaries', () => {
    expect(validateEmployee({ ...valid, salary: '0' }).salary).toBeDefined()
    expect(validateEmployee({ ...valid, salary: 'abc' }).salary).toBeDefined()
  })

  it('rejects malformed emails', () => {
    expect(validateEmployee({ ...valid, email: 'nope' }).email).toBeDefined()
  })

  it('rejects country values that are not 2-letter codes', () => {
    expect(validateEmployee({ ...valid, country: 'India' }).country).toBeDefined()
  })

  it('rejects future hire dates', () => {
    expect(validateEmployee({ ...valid, hire_date: '2999-01-01' }).hire_date).toBeDefined()
  })
})
