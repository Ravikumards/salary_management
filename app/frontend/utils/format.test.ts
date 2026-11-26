import { countryLabel, formatCurrency, formatSignedPercent } from './format'

describe('formatCurrency', () => {
  it('formats whole USD amounts with grouping', () => {
    expect(formatCurrency(85000)).toBe('$85,000')
  })

  it('renders a dash for missing values', () => {
    expect(formatCurrency(null)).toBe('—')
  })
})

describe('countryLabel', () => {
  it('shows the country name with its ISO code', () => {
    expect(countryLabel('IN')).toBe('India (IN)')
  })

  it('falls back to the code for unknown values', () => {
    expect(countryLabel('ZZ')).toContain('ZZ')
  })
})

describe('formatSignedPercent', () => {
  it('prefixes positive values with a plus sign', () => {
    expect(formatSignedPercent(12.5)).toBe('+12.5%')
  })

  it('keeps negative values negative', () => {
    expect(formatSignedPercent(-30.77)).toBe('-30.77%')
  })

  it('renders a dash for null', () => {
    expect(formatSignedPercent(null)).toBe('—')
  })
})
