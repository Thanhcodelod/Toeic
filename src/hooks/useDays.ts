import { useEffect, useState } from 'react'
import { getDays } from '../lib/api'
import type { DaySummary } from '../data/types'

interface UseDaysState {
  days: DaySummary[]
  loading: boolean
  error: string | null
}

/** Fetches the list of all 90 days (summaries) once. */
export function useDays(): UseDaysState {
  const [state, setState] = useState<UseDaysState>({
    days: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))
    getDays().then(
      (days) => {
        if (!cancelled) setState({ days, loading: false, error: null })
      },
      (err: unknown) => {
        if (!cancelled)
          setState({
            days: [],
            loading: false,
            error: err instanceof Error ? err.message : 'Lỗi tải dữ liệu',
          })
      },
    )
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
