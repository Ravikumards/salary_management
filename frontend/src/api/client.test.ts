import { ApiError, buildUrl, request } from './client'

const mockFetch = (status: number, body: unknown) =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(status === 204 ? null : JSON.stringify(body), { status }))

describe('buildUrl', () => {
  it('omits empty query values', () => {
    expect(buildUrl('/employees', { q: '', country: 'IN', page: 2, sort: undefined })).toBe('/api/v1/employees?country=IN&page=2')
  })
})

describe('request', () => {
  it('returns parsed JSON on success', async () => {
    mockFetch(200, { data: [1] })
    await expect(request('/x')).resolves.toEqual({ data: [1] })
  })

  it('returns undefined for 204 responses', async () => {
    mockFetch(204, null)
    await expect(request('/x', { method: 'DELETE' })).resolves.toBeUndefined()
  })

  it('throws an ApiError carrying field errors for 422 responses', async () => {
    mockFetch(422, { errors: { salary: ['Salary must be greater than 0'] } })

    const error = (await request('/x', { method: 'POST', body: {} }).catch((e: unknown) => e)) as ApiError

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(422)
    expect(error.fieldErrors.salary).toEqual(['Salary must be greater than 0'])
  })

  it('uses the server error message when present', async () => {
    mockFetch(404, { error: 'Employee not found' })
    await expect(request('/x')).rejects.toThrow('Employee not found')
  })
})
