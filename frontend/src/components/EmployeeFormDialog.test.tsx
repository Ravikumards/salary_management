import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmployeeFormDialog } from './EmployeeFormDialog'
import { ApiError } from '../api/client'
import type { Employee } from '../types'

const options = { countries: ['GB', 'IN'], job_titles: ['Engineer'], departments: ['Engineering'] }

const existing: Employee = {
  id: 7,
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
}

function setup(props: Partial<React.ComponentProps<typeof EmployeeFormDialog>> = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  const onClose = vi.fn()
  render(<EmployeeFormDialog open employee={null} options={options} onSubmit={onSubmit} onClose={onClose} {...props} />)
  return { onSubmit, onClose, user: userEvent.setup() }
}

describe('EmployeeFormDialog', () => {
  it('shows validation errors and does not submit an empty form', async () => {
    const { onSubmit, user } = setup()

    await user.click(screen.getByRole('button', { name: /add employee/i }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByLabelText(/first name/i)).toHaveAccessibleDescription(/required/i)
  })

  it('submits a normalized payload for a new employee', async () => {
    const { onSubmit, user } = setup()

    await user.type(screen.getByLabelText(/first name/i), 'Grace')
    await user.type(screen.getByLabelText(/last name/i), 'Hopper')
    await user.type(screen.getByLabelText(/email/i), 'grace@acme.test')
    await user.type(screen.getByLabelText(/job title/i), 'Engineer')
    await user.type(screen.getByLabelText(/department/i), 'Engineering')
    await user.type(screen.getByLabelText(/country/i), 'us')
    await user.type(screen.getByLabelText(/annual salary/i), '150000')
    await user.click(screen.getByRole('button', { name: /add employee/i }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ first_name: 'Grace', country: 'US', salary: 150000, employment_type: 'full_time' }),
    )
  })

  it('prefills the form when editing', () => {
    setup({ employee: existing })

    expect(screen.getByRole('heading', { name: /edit employee/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/first name/i)).toHaveValue('Ada')
    expect(screen.getByLabelText(/annual salary/i)).toHaveValue(120000)
  })

  it('maps server-side field errors onto the inputs', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new ApiError(422, 'Please fix', { email: ['has already been taken'] }))
    const { user } = setup({ employee: existing, onSubmit })

    await user.click(screen.getByRole('button', { name: /save changes/i }))

    expect(await screen.findByText(/has already been taken/i)).toBeInTheDocument()
  })
})
