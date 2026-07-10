import { useCallback, useEffect, useRef, useState } from 'react'

export interface CountdownState {
  /** Absolute epoch ms when the timer hits 0 (null when not running). */
  endTime: number | null
  secondsLeft: number
  running: boolean
}

export interface UseCountdownOptions {
  durationSeconds: number
  /** Hydrate from the server (applied once, when it first arrives). */
  initial?: CountdownState | null
  /** Called on meaningful transitions only (start / pause / reset / expire) —
   *  never on every tick, so persistence stays cheap. */
  onPersist?: (state: CountdownState) => void
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
 * Drift-proof countdown. Remaining time is always derived from an absolute
 * `endTime`, so background-tab throttling and refreshes never desync it.
 * State is persisted by the caller (to the DATABASE — never localStorage).
 */
export function useCountdown({
  durationSeconds,
  initial,
  onPersist,
  onExpire,
  autoStart = false,
}: UseCountdownOptions): UseCountdown {
  const onExpireRef = useRef(onExpire)
  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])
  const onPersistRef = useRef(onPersist)
  useEffect(() => {
    onPersistRef.current = onPersist
  }, [onPersist])

  const firedRef = useRef(false)
  const hydratedRef = useRef(false)

  const [state, setState] = useState<CountdownState>({
    endTime: autoStart ? Date.now() + durationSeconds * 1000 : null,
    secondsLeft: durationSeconds,
    running: autoStart,
  })

  // Hydrate once from the server-provided state.
  useEffect(() => {
    if (hydratedRef.current || !initial) return
    hydratedRef.current = true
    if (initial.running && initial.endTime) {
      const left = Math.max(0, Math.round((initial.endTime - Date.now()) / 1000))
      setState({ endTime: left > 0 ? initial.endTime : null, secondsLeft: left, running: left > 0 })
    } else {
      setState({ endTime: null, secondsLeft: initial.secondsLeft ?? durationSeconds, running: false })
    }
  }, [initial, durationSeconds])

  // Ticking — recompute from the absolute endTime each tick (no persistence here).
  useEffect(() => {
    if (!state.running) return
    const id = window.setInterval(() => {
      setState((prev) => {
        if (!prev.running || prev.endTime == null) return prev
        const left = Math.max(0, Math.round((prev.endTime - Date.now()) / 1000))
        if (left <= 0) return { endTime: null, secondsLeft: 0, running: false }
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
      onPersistRef.current?.({ endTime: null, secondsLeft: 0, running: false })
      onExpireRef.current?.()
    }
  }, [state.secondsLeft])

  const start = useCallback(() => {
    firedRef.current = false
    setState((prev) => {
      const seconds = prev.secondsLeft > 0 ? prev.secondsLeft : durationSeconds
      const next: CountdownState = {
        endTime: Date.now() + seconds * 1000,
        secondsLeft: seconds,
        running: true,
      }
      onPersistRef.current?.(next)
      return next
    })
  }, [durationSeconds])

  const pause = useCallback(() => {
    setState((prev) => {
      const next: CountdownState = { ...prev, running: false, endTime: null }
      onPersistRef.current?.(next)
      return next
    })
  }, [])

  const reset = useCallback(() => {
    firedRef.current = false
    const next: CountdownState = { endTime: null, secondsLeft: durationSeconds, running: false }
    onPersistRef.current?.(next)
    setState(next)
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
