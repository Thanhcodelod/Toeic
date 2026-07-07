import { useCallback, useEffect, useState } from 'react'

/**
 * Persisted state backed by Local Storage.
 *
 * - Reads the initial value from storage (falling back to `initialValue`).
 * - Writes back on every change.
 * - Syncs across tabs via the `storage` event.
 *
 * Safe against JSON parse errors and environments without `window`.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') return initialValue
    try {
      const raw = window.localStorage.getItem(key)
      return raw !== null ? (JSON.parse(raw) as T) : initialValue
    } catch (error) {
      console.warn(`useLocalStorage: không đọc được key "${key}"`, error)
      return initialValue
    }
  }, [key, initialValue])

  const [storedValue, setStoredValue] = useState<T>(readValue)

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next =
          typeof value === 'function' ? (value as (p: T) => T)(prev) : value
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(next))
          }
        } catch (error) {
          console.warn(`useLocalStorage: không ghi được key "${key}"`, error)
        }
        return next
      })
    },
    [key],
  )

  // Keep in sync when another tab updates the same key.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          setStoredValue(JSON.parse(event.newValue) as T)
        } catch {
          /* ignore malformed cross-tab payloads */
        }
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [key])

  return [storedValue, setValue]
}
