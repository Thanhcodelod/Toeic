// Server-side reads/writes for per-user learning progress (table
// `user_day_progress` + RPCs). Kept separate from the read-only content API in
// `api.ts`. All calls run as the authenticated user; RLS scopes rows by
// `auth.uid()`, so no manual user_id filter is needed on reads/writes.
import { getSupabase } from './supabase'
import type { OptionKey, ProgressMap } from '../data/types'

/** One row of `user_day_progress` as returned by select / RPC. */
export interface DayProgressRow {
  day_number: number
  status: 'in-progress' | 'done'
  best_score_pct: number | null
}

function mapRow(r: DayProgressRow): ProgressMap[number] {
  return {
    status: r.status,
    bestScorePct: r.best_score_pct ?? undefined,
  }
}

/** Fetch the whole progress map for the current user (RLS-scoped). */
export async function fetchUserProgress(): Promise<ProgressMap> {
  const { data, error } = await getSupabase()
    .from('user_day_progress')
    .select('day_number, status, best_score_pct')
  if (error) throw new Error(error.message)
  const map: ProgressMap = {}
  for (const r of (data as DayProgressRow[]) ?? []) map[r.day_number] = mapRow(r)
  return map
}

/** Runs a progress RPC and returns the authoritative row (for reconciliation). */
async function rpcDay(
  fn: string,
  args: Record<string, unknown>,
): Promise<DayProgressRow | null> {
  const { data, error } = await getSupabase().rpc(fn, args)
  if (error) throw new Error(error.message)
  const row = Array.isArray(data) ? data[0] : data
  return (row as DayProgressRow) ?? null
}

export const apiMarkInProgress = (day: number) =>
  rpcDay('mark_in_progress', { p_day: day })
export const apiMarkDone = (day: number) => rpcDay('mark_done', { p_day: day })
export const apiToggleDone = (day: number) =>
  rpcDay('toggle_done', { p_day: day })
export const apiRecordPractice = (
  day: number,
  scorePct: number,
  answers: Record<string, OptionKey>,
) =>
  rpcDay('record_day_practice', {
    p_day: day,
    p_score: scorePct,
    p_answers: answers,
  })


