import TextField from '@mui/material/TextField'

interface Props {
  id: string
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
  emptyLabel?: string
  minWidth?: number
}

/** Native <select> wrapped in an MUI TextField: accessible, keyboard friendly and fast with long lists. */
export function FilterSelect({ id, label, value, options, onChange, emptyLabel, minWidth = 160 }: Props) {
  return (
    <TextField
      id={id}
      select
      size="small"
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      slotProps={{ select: { native: true }, inputLabel: { shrink: true } }}
      sx={{ minWidth }}
    >
      {emptyLabel !== undefined && <option value="">{emptyLabel}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </TextField>
  )
}
