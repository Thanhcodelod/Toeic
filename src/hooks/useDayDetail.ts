import { useEffect, useState } from 'react'
import { getDayDetail } from '../lib/api'
import type { Day } from '../data/types'

interface UseDayDetailState {
  day: Day | null
  loading: boolean
  error: string | null
}

/** Fetches one day's full content, re-fetching whenever `dayNumber` changes. */
export function useDayDetail(dayNumber: number): UseDayDetailState {
  const [state, setState] = useState<UseDayDetailState>({
    day: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    setState({ day: null, loading: true, error: null })
    getDayDetail(dayNumber).then(
      (day) => {
        if (!cancelled) setState({ day, loading: false, error: null })
      },
      (err: unknown) => {
        if (!cancelled)
          setState({
            day: null,
            loading: false,
            error: err instanceof Error ? err.message : 'Lỗi tải dữ liệu',
          })
      },
    )
    return () => {
      cancelled = true
    }
  }, [dayNumber])

  return state
}
