import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { api as defaultApi, type Api } from '../api'
import { FilterSelect } from '../components/FilterSelect'
import { SalaryBar } from '../components/SalaryBar'
import { SalaryRange } from '../components/SalaryRange'
import { StatCard } from '../components/StatCard'
import { useAsync } from '../hooks/useAsync'
import { countryLabel, EMPLOYMENT_TYPE_LABELS, formatCompactCurrency, formatCurrency, formatSignedPercent } from '../utils/format'

function Section({ title, label, children, action }: { title: string; label?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Paper component="section" aria-label={label ?? title} variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" sx={{ mb: 1.5, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6" component="h2">
          {title}
        </Typography>
        {action}
      </Stack>
      {children}
    </Paper>
  )
}

const num = (n: number) => n.toLocaleString('en-US')

export function InsightsPage({ api = defaultApi }: { api?: Api }) {
  const overview = useAsync(() => api.overview(), [])
  const options = useAsync(() => api.filterOptions(), [])
  const [selectedCountry, setCountry] = useState('')
  const [jobTitle, setJobTitle] = useState('')

  // Until the user picks one, default to the largest country by headcount.
  const country = selectedCountry || overview.data?.countries[0]?.country || ''

  const countryInsights = useAsync(() => api.countryInsights(country), [country], { enabled: Boolean(country) })
  const jobTitleInsight = useAsync(() => api.jobTitleInsight(country, jobTitle), [country, jobTitle], {
    enabled: Boolean(country && jobTitle),
  })

  if (overview.error) return <Alert severity="error">Could not load insights. Is the API running?</Alert>
  if (!overview.data) return <CircularProgress aria-label="Loading insights" />

  const org = overview.data
  const summary = countryInsights.data?.summary
  const jobTitles = countryInsights.data?.job_titles ?? []
  const departments = countryInsights.data?.departments ?? []
  const maxTitleAverage = Math.max(0, ...jobTitles.map((t) => t.average))
  const maxCountryAverage = Math.max(0, ...org.countries.map((c) => c.average))
  const countryOptions = org.countries.map((c) => ({ value: c.country, label: `${countryLabel(c.country)} · ${num(c.headcount)}` }))
  const titleInCountry = jobTitleInsight.data

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5" component="h1">
          Salary insights
        </Typography>
        <Typography variant="body2" color="text.secondary">
          All salaries are annual, in USD.
        </Typography>
      </Box>

      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 2 }} component="section" aria-label="Organization summary">
        <StatCard label="Headcount" value={num(org.headcount)} hint={`${org.country_count} countries`} />
        <StatCard label="Annual payroll" value={formatCompactCurrency(org.total_payroll)} />
        <StatCard label="Average salary" value={formatCurrency(org.average)} />
        <StatCard
          label="Contractors"
          value={num(org.employment_types.contract ?? 0)}
          hint={`${num(org.employment_types.part_time ?? 0)} part-time`}
        />
      </Stack>

      <Section
        title={summary ? `${countryLabel(summary.country)}` : 'Country'}
        label="Country summary"
        action={<FilterSelect id="insights-country" label="Country" value={country} options={countryOptions} onChange={setCountry} minWidth={240} />}
      >
        {countryInsights.loading && !summary && <CircularProgress size={24} />}
        {summary && (
          <>
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 2 }}>
              <StatCard label="Headcount" value={num(summary.headcount)} />
              <StatCard label="Minimum" value={formatCurrency(summary.min)} />
              <StatCard label="Median" value={formatCurrency(summary.median)} />
              <StatCard label="Average" value={formatCurrency(summary.average)} />
              <StatCard label="Maximum" value={formatCurrency(summary.max)} />
              <StatCard label="Payroll" value={formatCompactCurrency(summary.total_payroll)} />
            </Stack>
            <SalaryRange summary={summary} />
          </>
        )}
      </Section>

      <Section
        title="Job title in country"
        action={
          <FilterSelect
            id="insights-job-title"
            label="Job title"
            emptyLabel="Select a job title"
            value={jobTitle}
            options={(options.data?.job_titles ?? []).map((t) => ({ value: t, label: t }))}
            onChange={setJobTitle}
            minWidth={240}
          />
        }
      >
        {!jobTitle && <Typography color="text.secondary">Pick a job title to see its average salary in {countryLabel(country)}.</Typography>}
        {titleInCountry && jobTitle && (
          titleInCountry.headcount === 0 ? (
            <Typography color="text.secondary">
              No {titleInCountry.job_title} employees in {countryLabel(titleInCountry.country)}.
            </Typography>
          ) : (
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 2 }}>
              <StatCard label={`Average ${titleInCountry.job_title}`} value={formatCurrency(titleInCountry.average)} hint={`${num(titleInCountry.headcount)} employees`} />
              <StatCard label="Range" value={`${formatCompactCurrency(titleInCountry.min)} – ${formatCompactCurrency(titleInCountry.max)}`} />
              <StatCard
                label="Vs. country average"
                value={formatSignedPercent(titleInCountry.difference_from_country_average_pct)}
                hint={`Country average ${formatCurrency(titleInCountry.country_average)}`}
              />
            </Stack>
          )
        )}
      </Section>

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} sx={{ alignItems: 'flex-start' }}>
        <Box sx={{ flex: 3, width: '100%' }}>
          <Section title={`Pay by job title${summary ? ` · ${summary.country}` : ''}`} label="Pay by job title">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Job title</TableCell>
                  <TableCell align="right">Headcount</TableCell>
                  <TableCell align="right">Min</TableCell>
                  <TableCell align="right">Average</TableCell>
                  <TableCell align="right">Max</TableCell>
                  <TableCell sx={{ width: '25%' }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {jobTitles.map((row) => (
                  <TableRow key={row.job_title}>
                    <TableCell>{row.job_title}</TableCell>
                    <TableCell align="right">{num(row.headcount)}</TableCell>
                    <TableCell align="right">{formatCurrency(row.min)}</TableCell>
                    <TableCell align="right">{formatCurrency(row.average)}</TableCell>
                    <TableCell align="right">{formatCurrency(row.max)}</TableCell>
                    <TableCell>
                      <SalaryBar value={row.average} max={maxTitleAverage} label={`${row.job_title} average`} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Section>
        </Box>
        <Box sx={{ flex: 2, width: '100%' }}>
          <Section title="Departments" label="Departments in country">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Department</TableCell>
                  <TableCell align="right">Headcount</TableCell>
                  <TableCell align="right">Average</TableCell>
                  <TableCell align="right">Payroll</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {departments.map((row) => (
                  <TableRow key={row.department}>
                    <TableCell>{row.department}</TableCell>
                    <TableCell align="right">{num(row.headcount)}</TableCell>
                    <TableCell align="right">{formatCurrency(row.average)}</TableCell>
                    <TableCell align="right">{formatCompactCurrency(row.total_payroll)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Section>
        </Box>
      </Stack>

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} sx={{ alignItems: 'flex-start' }}>
        <Box sx={{ flex: 3, width: '100%' }}>
          <Section title="Countries compared">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Country</TableCell>
                  <TableCell align="right">Headcount</TableCell>
                  <TableCell align="right">Min</TableCell>
                  <TableCell align="right">Average</TableCell>
                  <TableCell align="right">Max</TableCell>
                  <TableCell align="right">Payroll</TableCell>
                  <TableCell sx={{ width: '20%' }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {org.countries.map((row) => (
                  <TableRow key={row.country} hover selected={row.country === country} onClick={() => setCountry(row.country)} sx={{ cursor: 'pointer' }}>
                    <TableCell>{countryLabel(row.country)}</TableCell>
                    <TableCell align="right">{num(row.headcount)}</TableCell>
                    <TableCell align="right">{formatCompactCurrency(row.min)}</TableCell>
                    <TableCell align="right">{formatCompactCurrency(row.average)}</TableCell>
                    <TableCell align="right">{formatCompactCurrency(row.max)}</TableCell>
                    <TableCell align="right">{formatCompactCurrency(row.total_payroll)}</TableCell>
                    <TableCell>
                      <SalaryBar value={row.average} max={maxCountryAverage} label={`${row.country} average`} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Section>
        </Box>
        <Box sx={{ flex: 2, width: '100%' }}>
          <Section title="Highest paying job titles">
            <Table size="small">
              <TableBody>
                {org.top_job_titles.map((row) => (
                  <TableRow key={row.job_title}>
                    <TableCell>{row.job_title}</TableCell>
                    <TableCell align="right">{formatCurrency(row.average)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Typography variant="subtitle2" sx={{ mt: 2 }}>
              Employment mix
            </Typography>
            <Table size="small">
              <TableBody>
                {Object.entries(org.employment_types).map(([type, count]) => (
                  <TableRow key={type}>
                    <TableCell>{EMPLOYMENT_TYPE_LABELS[type] ?? type}</TableCell>
                    <TableCell align="right">
                      {num(count ?? 0)} ({org.headcount ? Math.round(((count ?? 0) / org.headcount) * 100) : 0}%)
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Section>
        </Box>
      </Stack>
    </Stack>
  )
}
