import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { TOTAL_DAYS } from '../data/constants'
import {
  apiMarkDone,
  apiMarkInProgress,
  apiRecordPractice,
  apiResetAll,
  apiToggleDone,
  apiUpsertMerged,
  fetchUserProgress,
  type DayProgressRow,
} from '../lib/progressApi'
import {
  clearLegacy,
  clearLocalDrafts,
  mergeMaps,
  readCache,
  readLegacy,
  writeCache,
} from '../lib/progressLocal'
import type { DayStatus, OptionKey, ProgressMap } from '../data/types'

export interface UseProgress {
  progress: ProgressMap
  /** True during the initial server fetch for the current user. */
  loading: boolean
  /** Last load/sync error (optional to surface). */
  error: string | null
  getStatus: (dayNumber: number) => DayStatus
  getBestScore: (dayNumber: number) => number | undefined
  getSavedAnswers: (dayNumber: number) => Record<string, OptionKey> | undefined
  markInProgress: (dayNumber: number) => void
  markDone: (dayNumber: number) => void
  toggleDone: (dayNumber: number) => void
  recordPractice: (
    dayNumber: number,
    scorePct: number,
    answers: Record<string, OptionKey>,
  ) => void
  resetAll: () => void
  doneCount: number
  completionPct: number
  /** Legacy device-local progress detected → offer a one-time merge. */
  legacyMergeAvailable: boolean
  applyLegacyMerge: () => void
  dismissLegacyMerge: () => void
}

function rowToProgress(row: DayProgressRow): ProgressMap[number] {
  return {
    status: row.status,
    bestScorePct: row.best_score_pct ?? undefined,
    answers:
      row.answers && Object.keys(row.answers).length ? row.answers : undefined,
  }
}

export function useProgress(): UseProgress {
  const { user } = useAuth()
  const userId = user?.id ?? null

  // Seed synchronously from the per-user cache so the first paint isn't 0%.
  const [progress, setProgress] = useState<ProgressMap>(() => readCache(userId))
  const [loading, setLoading] = useState<boolean>(Boolean(userId))
  const [error, setError] = useState<string | null>(null)
  const [legacyMergeAvailable, setLegacyMergeAvailable] = useState(false)

  // Latest progress for reads outside the setState updater (merge, optimistic).
  const progressRef = useRef(progress)
  progressRef.current = progress
  // Serialize writes per day so out-of-order responses can't desync a day.
  const writeChain = useRef<Map<number, Promise<unknown>>>(new Map())

  // Persist every change to the per-user cache.
  useEffect(() => {
    if (userId) writeCache(userId, progress)
  }, [userId, progress])

  // Load the authoritative map whenever the user changes.
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
        const legacy = readLegacy()
        if (legacy && Object.keys(legacy).length > 0)
          setLegacyMergeAvailable(true)
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

  // Reconcile a single day from the server's authoritative row.
  const applyRow = useCallback((day: number, row: DayProgressRow | null) => {
    setProgress((prev) => {
      const next = { ...prev }
      if (row) next[day] = rowToProgress(row)
      else delete next[day]
      return next
    })
  }, [])

  // Optimistic update + queued server write + reconcile.
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
  const getSavedAnswers = useCallback(
    (dayNumber: number) => progress[dayNumber]?.answers,
    [progress],
  )

  const markInProgress = useCallback(
    (dayNumber: number) => {
      const cur = progressRef.current[dayNumber]?.status
      if (cur === 'done' || cur === 'in-progress') return
      runWrite(
        dayNumber,
        (prev) => ({
          ...prev,
          [dayNumber]: { ...prev[dayNumber], status: 'in-progress' },
        }),
        () => apiMarkInProgress(dayNumber),
      )
    },
    [runWrite],
  )

  const markDone = useCallback(
    (dayNumber: number) => {
      runWrite(
        dayNumber,
        (prev) => ({
          ...prev,
          [dayNumber]: { ...prev[dayNumber], status: 'done' },
        }),
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

  const recordPractice = useCallback(
    (
      dayNumber: number,
      scorePct: number,
      answers: Record<string, OptionKey>,
    ) => {
      runWrite(
        dayNumber,
        (prev) => {
          const best = Math.max(prev[dayNumber]?.bestScorePct ?? 0, scorePct)
          return {
            ...prev,
            [dayNumber]: {
              ...prev[dayNumber],
              status: 'done',
              bestScorePct: best,
              answers,
            },
          }
        },
        () => apiRecordPractice(dayNumber, scorePct, answers),
      )
    },
    [runWrite],
  )

  const resetAll = useCallback(() => {
    setProgress({})
    if (userId) {
      writeCache(userId, {})
      apiResetAll(userId).catch((e) => {
        console.warn('Xoá tiến trình thất bại', e)
        setError((e as Error)?.message ?? 'Lỗi xoá tiến trình')
        void refetch()
      })
    }
    clearLocalDrafts(TOTAL_DAYS)
  }, [userId, refetch])

  const applyLegacyMerge = useCallback(() => {
    const legacy = readLegacy()
    setLegacyMergeAvailable(false)
    clearLegacy()
    if (!userId || !legacy || Object.keys(legacy).length === 0) return
    const merged = mergeMaps(progressRef.current, legacy)
    setProgress(merged)
    const rows = Object.entries(merged).map(([day, dp]) => ({
      day_number: Number(day),
      status: dp.status,
      best_score_pct: dp.bestScorePct ?? null,
      answers: dp.answers ?? {},
    }))
    apiUpsertMerged(userId, rows).catch((e) => {
      console.warn('Gộp tiến trình thất bại', e)
      setError((e as Error)?.message ?? 'Lỗi gộp tiến trình')
      void refetch()
    })
  }, [userId, refetch])

  const dismissLegacyMerge = useCallback(() => {
    setLegacyMergeAvailable(false)
    clearLegacy()
  }, [])

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
    getSavedAnswers,
    markInProgress,
    markDone,
    toggleDone,
    recordPractice,
    resetAll,
    doneCount,
    completionPct,
    legacyMergeAvailable,
    applyLegacyMerge,
    dismissLegacyMerge,
  }
}
