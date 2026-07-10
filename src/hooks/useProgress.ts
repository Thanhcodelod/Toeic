import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { TOTAL_DAYS } from '../data/constants'
import { resetAllProgress } from '../lib/answersApi'
import {
  apiMarkDone,
  apiMarkInProgress,
  apiRecordPractice,
  apiToggleDone,
  fetchUserProgress,
  type DayProgressRow,
} from '../lib/progressApi'
import type { DayStatus, ProgressMap } from '../data/types'

export interface UseProgress {
  progress: ProgressMap
  /** True during the initial server fetch. Nothing is cached in the browser. */
  loading: boolean
  error: string | null
  getStatus: (dayNumber: number) => DayStatus
  getBestScore: (dayNumber: number) => number | undefined
  markInProgress: (dayNumber: number) => void
  markDone: (dayNumber: number) => void
  toggleDone: (dayNumber: number) => void
  recordPractice: (dayNumber: number, scorePct: number) => void
  resetAll: () => void
  doneCount: number
  completionPct: number
}

function rowToProgress(row: DayProgressRow): ProgressMap[number] {
  return {
    status: row.status,
    bestScorePct: row.best_score_pct ?? undefined,
  }
}

export function useProgress(): UseProgress {
  const { user } = useAuth()
  const userId = user?.id ?? null

  const [progress, setProgress] = useState<ProgressMap>({})
  const [loading, setLoading] = useState<boolean>(Boolean(userId))
  const [error, setError] = useState<string | null>(null)

  const progressRef = useRef(progress)
  progressRef.current = progress
  // Serialize writes per day so out-of-order responses can't desync a day.
  const writeChain = useRef<Map<number, Promise<unknown>>>(new Map())

  // Load the authoritative map from the server whenever the user changes.
  useEffect(() => {
    if (!userId) {
      setProgress({})
      setLoading(false)
      return
    }
    let ignore = false
    setLoading(true)
    fetchUserProgress()
      .then((map) => {
        if (ignore) return
        setProgress(map)
        setError(null)
        setLoading(false)
      })
      .catch((e: unknown) => {
        if (ignore) return
        console.warn('Tải tiến trình thất bại', e)
        setError((e as Error)?.message ?? 'Lỗi tải tiến trình')
        setLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [userId])

  const refetch = useCallback(async () => {
    try {
      setProgress(await fetchUserProgress())
    } catch (e) {
      console.warn('Đồng bộ lại tiến trình thất bại', e)
    }
  }, [])

  const applyRow = useCallback((day: number, row: DayProgressRow | null) => {
    setProgress((prev) => {
      const next = { ...prev }
      if (row) next[day] = rowToProgress(row)
      else delete next[day]
      return next
    })
  }, [])

  const runWrite = useCallback(
    (
      day: number,
      optimistic: (prev: ProgressMap) => ProgressMap,
      remote: () => Promise<DayProgressRow | null>,
    ) => {
      setProgress(optimistic)
      const prev = writeChain.current.get(day) ?? Promise.resolve()
      const task = prev
        .catch(() => {})
        .then(async () => {
          try {
            applyRow(day, await remote())
          } catch (e) {
            console.warn('Lưu tiến trình thất bại', e)
            setError((e as Error)?.message ?? 'Lỗi lưu tiến trình')
            await refetch()
          }
        })
      writeChain.current.set(day, task)
    },
    [applyRow, refetch],
  )

  const getStatus = useCallback(
    (dayNumber: number): DayStatus =>
      progress[dayNumber]?.status ?? 'not-started',
    [progress],
  )
  const getBestScore = useCallback(
    (dayNumber: number) => progress[dayNumber]?.bestScorePct,
    [progress],
  )

  const markInProgress = useCallback(
    (dayNumber: number) => {
      const cur = progressRef.current[dayNumber]?.status
      if (cur === 'done' || cur === 'in-progress') return
      runWrite(
        dayNumber,
        (prev) => ({ ...prev, [dayNumber]: { ...prev[dayNumber], status: 'in-progress' } }),
        () => apiMarkInProgress(dayNumber),
      )
    },
    [runWrite],
  )

  const markDone = useCallback(
    (dayNumber: number) => {
      runWrite(
        dayNumber,
        (prev) => ({ ...prev, [dayNumber]: { ...prev[dayNumber], status: 'done' } }),
        () => apiMarkDone(dayNumber),
      )
    },
    [runWrite],
  )

  const toggleDone = useCallback(
    (dayNumber: number) => {
      runWrite(
        dayNumber,
        (prev) => {
          const cur = prev[dayNumber]?.status
          return {
            ...prev,
            [dayNumber]: {
              ...prev[dayNumber],
              status: cur === 'done' ? 'in-progress' : 'done',
            },
          }
        },
        () => apiToggleDone(dayNumber),
      )
    },
    [runWrite],
  )

  /** Individual answers are already persisted per question; this records the score. */
  const recordPractice = useCallback(
    (dayNumber: number, scorePct: number) => {
      runWrite(
        dayNumber,
        (prev) => {
          const best = Math.max(prev[dayNumber]?.bestScorePct ?? 0, scorePct)
          return {
            ...prev,
            [dayNumber]: { ...prev[dayNumber], status: 'done', bestScorePct: best },
          }
        },
        () => apiRecordPractice(dayNumber, scorePct, {}),
      )
    },
    [runWrite],
  )

  const resetAll = useCallback(() => {
    setProgress({})
    resetAllProgress().catch((e) => {
      console.warn('Xoá tiến trình thất bại', e)
      setError((e as Error)?.message ?? 'Lỗi xoá tiến trình')
      void refetch()
    })
  }, [refetch])

  const doneCount = useMemo(
    () => Object.values(progress).filter((p) => p.status === 'done').length,
    [progress],
  )
  const completionPct = useMemo(
    () => Math.round((doneCount / TOTAL_DAYS) * 100),
    [doneCount],
  )

  return {
    progress,
    loading,
    error,
    getStatus,
    getBestScore,
    markInProgress,
    markDone,
    toggleDone,
    recordPractice,
    resetAll,
    doneCount,
    completionPct,
  }
}
