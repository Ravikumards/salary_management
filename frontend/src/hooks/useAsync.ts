import { useCallback, useEffect, useState, type DependencyList } from 'react'

export interface AsyncState<T> {
  data: T | undefined
  error: unknown
  loading: boolean
  reload: () => void
}

interface Settled<T> {
  key: string
  data: T | undefined
  error: unknown
}

/**
 * Runs an async loader whenever `deps` change.
 * - Responses from stale requests are ignored, so fast-changing filters never render out of order.
 * - The previous data is kept while a new request is in flight (no table flicker).
 * - `loading` is derived (current request key not yet settled) rather than stored.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: DependencyList, { enabled = true } = {}): AsyncState<T> {
  const [version, setVersion] = useState(0)
  const [settled, setSettled] = useState<Settled<T>>({ key: '', data: undefined, error: null })
  const key = JSON.stringify([...deps, version])

  useEffect(() => {
    if (!enabled) return
    let active = true
    loader()
      .then((data) => active && setSettled({ key, data, error: null }))
      .catch((error: unknown) => active && setSettled((prev) => ({ key, data: prev.data, error })))
    return () => {
      active = false
    }
    // `key` captures deps + reload version; the loader closure is intentionally excluded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled])

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  return {
    data: settled.data,
    error: settled.key === key ? settled.error : null,
    loading: enabled && settled.key !== key,
    reload,
  }
}
