// Local-storage helpers for the server-backed progress layer:
//  - a per-user cache (`toeic90:progress:<userId>`) for instant first paint /
//    offline read, reconciled after the server fetch returns;
//  - the one-time legacy migration from the old device-local key
//    (`toeic90:progress`) into the signed-in account.
import type { DayProgress, ProgressMap } from '../data/types'

const LEGACY_KEY = 'toeic90:progress'
const cacheKey = (userId: string) => `toeic90:progress:${userId}`

function parse(raw: string | null): ProgressMap | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as ProgressMap
  } catch {
    return null
  }
}

export function readCache(userId: string | null): ProgressMap {
  if (!userId || typeof window === 'undefined') return {}
  return parse(window.localStorage.getItem(cacheKey(userId))) ?? {}
}

export function writeCache(userId: string | null, map: ProgressMap): void {
  if (!userId || typeof window === 'undefined') return
  try {
    window.localStorage.setItem(cacheKey(userId), JSON.stringify(map))
  } catch {
    /* quota / private mode — ignore, server remains source of truth */
  }
}

export function readLegacy(): ProgressMap | null {
  if (typeof window === 'undefined') return null
  return parse(window.localStorage.getItem(LEGACY_KEY))
}

export function clearLegacy(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(LEGACY_KEY)
  } catch {
    /* ignore */
  }
}

/** Merge two progress maps: done wins, best score is the max, keep any answers. */
export function mergeMaps(server: ProgressMap, legacy: ProgressMap): ProgressMap {
  const out: ProgressMap = { ...server }
  for (const [key, lv] of Object.entries(legacy)) {
    const day = Number(key)
    const sv = out[day]
    if (!sv) {
      out[day] = lv
      continue
    }
    const status: DayProgress['status'] =
      sv.status === 'done' || lv.status === 'done' ? 'done' : 'in-progress'
    const best = Math.max(sv.bestScorePct ?? -1, lv.bestScorePct ?? -1)
    out[day] = {
      status,
      bestScorePct: best < 0 ? undefined : best,
      answers: sv.answers ?? lv.answers,
    }
  }
  return out
}

/** Remove per-day in-progress draft keys (answers + timer) on this device. */
export function clearLocalDrafts(totalDays: number): void {
  if (typeof window === 'undefined') return
  for (let d = 1; d <= totalDays; d++) {
    for (const k of [
      `toeic90:grammar:${d}:answers`,
      `toeic90:practice:${d}:answers`,
      `toeic90:practice:${d}:timer`,
      `toeic90:exam:${d}:answers`,
      `toeic90:exam:${d}:timer`,
    ]) {
      try {
        window.localStorage.removeItem(k)
      } catch {
        /* ignore */
      }
    }
  }
}
