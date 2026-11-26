import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { CountrySummary } from '../types'
import { formatCompactCurrency } from '../utils/format'

/** Box-plot style strip: min .. [p25 | median | p75] .. max, showing the salary spread at a glance. */
export function SalaryRange({ summary }: { summary: CountrySummary }) {
  const { min, max, p25, p75, median } = summary
  if (min === null || max === null || p25 === null || p75 === null || median === null) return null

  const span = max - min || 1
  const pct = (v: number) => `${((v - min) / span) * 100}%`

  return (
    <Box aria-label="Salary distribution" role="img" sx={{ mt: 1 }}>
      <Box sx={{ position: 'relative', height: 24 }}>
        <Box sx={{ position: 'absolute', top: 11, left: 0, right: 0, height: 2, bgcolor: 'divider' }} />
        <Box
          sx={{
            position: 'absolute',
            top: 4,
            height: 16,
            left: pct(p25),
            width: `calc(${pct(p75)} - ${pct(p25)})`,
            bgcolor: 'primary.light',
            borderRadius: 1,
            opacity: 0.6,
          }}
        />
        <Box sx={{ position: 'absolute', top: 0, height: 24, width: 3, left: pct(median), bgcolor: 'primary.dark' }} />
      </Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
        <Typography variant="caption">Min {formatCompactCurrency(min)}</Typography>
        <Typography variant="caption">
          Middle 50%: {formatCompactCurrency(p25)} – {formatCompactCurrency(p75)}
        </Typography>
        <Typography variant="caption">Max {formatCompactCurrency(max)}</Typography>
      </Stack>
    </Box>
  )
}
