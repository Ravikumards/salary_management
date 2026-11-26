const BASE_URL = `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/v1`

export type FieldErrors = Record<string, string[]>

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: FieldErrors

  constructor(status: number, message: string, fieldErrors: FieldErrors = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

type Query = Record<string, string | number | undefined | null>

export function buildUrl(path: string, query: Query = {}): string {
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
  })
  const qs = params.toString()
  return `${BASE_URL}${path}${qs ? `?${qs}` : ''}`
}

export async function request<T>(path: string, options: { method?: string; body?: unknown; query?: Query } = {}): Promise<T> {
  const response = await fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (response.status === 204) return undefined as T

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const fieldErrors: FieldErrors = payload.errors ?? {}
    const message = payload.error ?? (Object.keys(fieldErrors).length ? 'Please fix the highlighted fields' : `Request failed (${response.status})`)
    throw new ApiError(response.status, message, fieldErrors)
  }
  return payload as T
}
