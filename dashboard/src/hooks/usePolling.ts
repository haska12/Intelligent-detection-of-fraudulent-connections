import { useState, useEffect, useCallback, useRef } from 'react'

export function usePolling<T>(fetcher: () => Promise<T>, ms: number, init: T) {
  const [data, setData]         = useState<T>(init)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [lastUpdated, setLast]  = useState<Date | null>(null)
  const ref = useRef(fetcher)
  ref.current = fetcher

  const run = useCallback(async () => {
    try {
      const r = await ref.current()
      setData(r); setError(null); setLast(new Date())
    } catch (e: any) {
      setError(e?.message ?? 'Error')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { run(); const id = setInterval(run, ms); return () => clearInterval(id) }, [run, ms])
  return { data, loading, error, lastUpdated, refresh: run }
}
