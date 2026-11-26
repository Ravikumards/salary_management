import Box from '@mui/material/Box'

interface Props {
  value: number
  max: number
  label: string
}

/** Lightweight horizontal bar (no charting dependency) for comparing averages in a table. */
export function SalaryBar({ value, max, label }: Props) {
  const width = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0
  return (
    <Box role="img" aria-label={label} sx={{ width: '100%', minWidth: 80, height: 8, bgcolor: 'action.hover', borderRadius: 4 }}>
      <Box sx={{ width: `${width}%`, height: '100%', bgcolor: 'primary.main', borderRadius: 4 }} />
    </Box>
  )
}
