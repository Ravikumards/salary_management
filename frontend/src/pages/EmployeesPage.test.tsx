import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmployeesPage } from './EmployeesPage'
import { mockApi } from '../test/fixtures'

describe('EmployeesPage', () => {
  it('lists employees returned by the API with the total count', async () => {
    render(<EmployeesPage api={mockApi()} />)

    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText('Alan Turing')).toBeInTheDocument()
    expect(screen.getByText('$150,000')).toBeInTheDocument()
    expect(screen.getByText(/2 employees/i)).toBeInTheDocument()
  })

  it('searches by name', async () => {
    const api = mockApi()
    const user = userEvent.setup()
    render(<EmployeesPage api={api} />)

    await user.type(screen.getByRole('searchbox', { name: /search/i }), 'ada')

    await waitFor(() => expect(api.listEmployees).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'ada', page: 1 })))
  })

  it('filters by country', async () => {
    const api = mockApi()
    const user = userEvent.setup()
    render(<EmployeesPage api={api} />)
    await screen.findByText('Ada Lovelace')

    await user.selectOptions(screen.getByLabelText(/^country$/i), 'IN')

    await waitFor(() => expect(api.listEmployees).toHaveBeenLastCalledWith(expect.objectContaining({ country: 'IN' })))
  })

  it('deletes an employee after confirmation and reloads the list', async () => {
    const api = mockApi()
    const user = userEvent.setup()
    render(<EmployeesPage api={api} />)

    const row = (await screen.findByText('Ada Lovelace')).closest('tr')!
    await user.click(within(row).getByRole('button', { name: /delete ada lovelace/i }))
    await user.click(screen.getByRole('button', { name: /^delete$/i }))

    expect(api.deleteEmployee).toHaveBeenCalledWith(1)
    await waitFor(() => expect(api.listEmployees).toHaveBeenCalledTimes(2))
  })

  it('creates an employee through the dialog', async () => {
    const api = mockApi()
    const user = userEvent.setup()
    render(<EmployeesPage api={api} />)
    await screen.findByText('Ada Lovelace')

    await user.click(screen.getByRole('button', { name: /add employee/i }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText(/first name/i), 'Grace')
    await user.type(within(dialog).getByLabelText(/last name/i), 'Hopper')
    await user.type(within(dialog).getByLabelText(/email/i), 'grace@acme.test')
    await user.type(within(dialog).getByLabelText(/job title/i), 'Engineer')
    await user.type(within(dialog).getByLabelText(/department/i), 'Engineering')
    await user.type(within(dialog).getByLabelText(/country/i), 'US')
    await user.type(within(dialog).getByLabelText(/annual salary/i), '99000')
    await user.click(within(dialog).getByRole('button', { name: /add employee/i }))

    await waitFor(() => expect(api.createEmployee).toHaveBeenCalledWith(expect.objectContaining({ first_name: 'Grace', salary: 99000 })))
    expect(await screen.findByText(/employee added/i)).toBeInTheDocument()
  })

  it('shows an error when the list fails to load', async () => {
    const api = mockApi({ listEmployees: vi.fn().mockRejectedValue(new Error('boom')) })
    render(<EmployeesPage api={api} />)

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load employees/i)
  })
})
