const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const compactCurrency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 })
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })

export const EMPTY = '—'

export function formatCurrency(value: number | null | undefined): string {
  return value === null || value === undefined ? EMPTY : currency.format(value)
}

export function formatCompactCurrency(value: number | null | undefined): string {
  return value === null || value === undefined ? EMPTY : compactCurrency.format(value)
}

export function countryName(code: string): string {
  try {
    return regionNames.of(code) ?? code
  } catch {
    return code
  }
}

export function countryLabel(code: string): string {
  const name = countryName(code)
  return name === code ? code : `${name} (${code})`
}

export function formatSignedPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return EMPTY
  return `${value > 0 ? '+' : ''}${value}%`
}

export const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
}
