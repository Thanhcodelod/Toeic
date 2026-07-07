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
  answers: Record<string, OptionKey> | null
}

function mapRow(r: DayProgressRow): ProgressMap[number] {
  return {
    status: r.status,
    bestScorePct: r.best_score_pct ?? undefined,
    answers: r.answers && Object.keys(r.answers).length ? r.answers : undefined,
  }
}

/** Fetch the whole progress map for the current user (RLS-scoped). */
export async function fetchUserProgress(): Promise<ProgressMap> {
  const { data, error } = await getSupabase()
    .from('user_day_progress')
    .select('day_number, status, best_score_pct, answers')
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

/** Delete all of the current user's progress rows. */
export async function apiResetAll(userId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('user_day_progress')
    .delete()
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
}

export interface MergeRow {
  day_number: number
  status: 'in-progress' | 'done'
  best_score_pct: number | null
  answers: Record<string, OptionKey>
}

/** Bulk upsert for the one-time local→server merge on first login. */
export async function apiUpsertMerged(
  userId: string,
  rows: MergeRow[],
): Promise<void> {
  if (rows.length === 0) return
  const payload = rows.map((r) => ({ ...r, user_id: userId }))
  const { error } = await getSupabase()
    .from('user_day_progress')
    .upsert(payload, { onConflict: 'user_id,day_number' })
  if (error) throw new Error(error.message)
}
