import { useCallback, useEffect, useRef, useState } from 'react'

interface CountdownState {
  /** Absolute epoch ms when the timer hits 0 (null when not running). */
  endTime: number | null
  secondsLeft: number
  running: boolean
}

export interface UseCountdownOptions {
  durationSeconds: number
  /** Persist to Local Storage so a refresh mid-test resumes. */
  storageKey?: string
  /** Fired once when the timer reaches 0 (e.g. auto-submit). */
  onExpire?: () => void
  autoStart?: boolean
}

export interface UseCountdown {
  secondsLeft: number
  running: boolean
  isExpired: boolean
  /** mm:ss */
  formatted: string
  start: () => void
  pause: () => void
  reset: () => void
}

function format(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * Drift-proof countdown.
 *
 * Remaining time is always derived from an absolute `endTime`, so background-tab
 * throttling and refreshes never desync it. State can be persisted so a page
 * reload mid-test resumes exactly where it left off.
 */
export function useCountdown({
  durationSeconds,
  storageKey,
  onExpire,
  autoStart = false,
}: UseCountdownOptions): UseCountdown {
  const onExpireRef = useRef(onExpire)
  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  const firedRef = useRef(false)

  const [state, setState] = useState<CountdownState>(() => {
    if (storageKey && typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(storageKey)
        if (raw) {
          const saved = JSON.parse(raw) as CountdownState
          if (saved.running && saved.endTime) {
            const left = Math.max(
              0,
              Math.round((saved.endTime - Date.now()) / 1000),
            )
            return { endTime: left > 0 ? saved.endTime : null, secondsLeft: left, running: left > 0 }
          }
          return {
            endTime: null,
            secondsLeft: saved.secondsLeft ?? durationSeconds,
            running: false,
          }
        }
      } catch {
        /* fall through to defaults */
      }
    }
    return {
      endTime: autoStart ? Date.now() + durationSeconds * 1000 : null,
      secondsLeft: durationSeconds,
      running: autoStart,
    }
  })

  // Persist on every change.
  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return
    window.localStorage.setItem(storageKey, JSON.stringify(state))
  }, [state, storageKey])

  // Ticking — recompute from the absolute endTime each tick.
  useEffect(() => {
    if (!state.running) return
    const id = window.setInterval(() => {
      setState((prev) => {
        if (!prev.running || prev.endTime == null) return prev
        const left = Math.max(0, Math.round((prev.endTime - Date.now()) / 1000))
        if (left <= 0) {
          return { endTime: null, secondsLeft: 0, running: false }
        }
        return { ...prev, secondsLeft: left }
      })
    }, 500)
    return () => window.clearInterval(id)
  }, [state.running])

  // Recompute immediately when the tab regains focus (corrects throttled drift).
  useEffect(() => {
    if (typeof document === 'undefined') return
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      setState((prev) => {
        if (!prev.running || prev.endTime == null) return prev
        const left = Math.max(0, Math.round((prev.endTime - Date.now()) / 1000))
        return left > 0
          ? { ...prev, secondsLeft: left }
          : { endTime: null, secondsLeft: 0, running: false }
      })
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  // Fire onExpire exactly once when the clock reaches 0.
  useEffect(() => {
    if (state.secondsLeft > 0) {
      firedRef.current = false
      return
    }
    if (!firedRef.current) {
      firedRef.current = true
      onExpireRef.current?.()
    }
  }, [state.secondsLeft])

  const start = useCallback(() => {
    firedRef.current = false
    setState((prev) => {
      const seconds = prev.secondsLeft > 0 ? prev.secondsLeft : durationSeconds
      return {
        endTime: Date.now() + seconds * 1000,
        secondsLeft: seconds,
        running: true,
      }
    })
  }, [durationSeconds])

  const pause = useCallback(() => {
    setState((prev) => ({ ...prev, running: false, endTime: null }))
  }, [])

  const reset = useCallback(() => {
    firedRef.current = false
    setState({ endTime: null, secondsLeft: durationSeconds, running: false })
  }, [durationSeconds])

  return {
    secondsLeft: state.secondsLeft,
    running: state.running,
    isExpired: state.secondsLeft === 0,
    formatted: format(state.secondsLeft),
    start,
    pause,
    reset,
  }
}
