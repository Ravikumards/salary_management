import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InsightsPage } from './InsightsPage'
import { mockApi } from '../test/fixtures'

describe('InsightsPage', () => {
  it('shows organization-wide KPIs', async () => {
    render(<InsightsPage api={mockApi()} />)

    expect(await screen.findByText('10,000')).toBeInTheDocument()
    expect(screen.getByText('$95,000')).toBeInTheDocument()
  })

  it('shows min, max, average and median for the selected country', async () => {
    const api = mockApi()
    render(<InsightsPage api={api} />)

    // Defaults to the largest country by headcount.
    await waitFor(() => expect(api.countryInsights).toHaveBeenCalledWith('IN'))
    const summary = await screen.findByRole('region', { name: /country summary/i })
    expect(summary).toHaveTextContent('$20,000')
    expect(summary).toHaveTextContent('$90,000')
    expect(summary).toHaveTextContent('$40,000')
    expect(summary).toHaveTextContent('$38,000')
  })

  it('loads another country when selected', async () => {
    const api = mockApi()
    const user = userEvent.setup()
    render(<InsightsPage api={api} />)
    await screen.findByRole('region', { name: /country summary/i })

    await user.selectOptions(screen.getByLabelText(/^country$/i), 'GB')

    await waitFor(() => expect(api.countryInsights).toHaveBeenLastCalledWith('GB'))
  })

  it('shows the average salary for a job title in the country', async () => {
    const api = mockApi()
    const user = userEvent.setup()
    render(<InsightsPage api={api} />)
    await screen.findByRole('region', { name: /country summary/i })

    await user.selectOptions(screen.getByLabelText(/^job title$/i), 'Manager')

    await waitFor(() => expect(api.jobTitleInsight).toHaveBeenCalledWith('IN', 'Manager'))
    const card = await screen.findByRole('region', { name: /job title in country/i })
    expect(card).toHaveTextContent('$70,000')
    expect(card).toHaveTextContent('+75%')
  })
})
