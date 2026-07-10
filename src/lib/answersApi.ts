// Every learner action is persisted to the DATABASE — no localStorage anywhere.
// Answers are keyed by (day_number, source, q_ord); `q_ord` is stable across
// content re-seeds. Correctness is graded SERVER-SIDE (the client cannot lie).
import { getSupabase } from './supabase'
import type { OptionKey } from '../data/types'

export type AnswerSource = 'grammar' | 'practice' | 'exam'

export interface Profile {
  id: string
  email: string | null
  displayName: string | null
}

/** The signed-in user's account row. */
export async function getProfile(): Promise<Profile | null> {
  const { data, error } = await getSupabase()
    .from('profiles')
    .select('id, email, display_name')
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  const r = data as { id: string; email: string | null; display_name: string | null }
  return { id: r.id, email: r.email, displayName: r.display_name }
}

/** Saves ONE answer. Returns whether it was correct (graded by the server). */
export async function saveAnswer(
  day: number,
  source: AnswerSource,
  ord: number,
  chosen: OptionKey,
): Promise<boolean> {
  const { data, error } = await getSupabase().rpc('save_question_answer', {
    p_day: day,
    p_source: source,
    p_ord: ord,
    p_chosen: chosen,
  })
  if (error) throw new Error(error.message)
  return Boolean(data)
}

/** All answers this user has given for a day+section, keyed by question ord. */
export async function getDayAnswers(
  day: number,
  source: AnswerSource,
): Promise<Record<number, OptionKey>> {
  const { data, error } = await getSupabase()
    .from('user_question_answers')
    .select('q_ord, chosen')
    .eq('day_number', day)
    .eq('source', source)
  if (error) throw new Error(error.message)
  const out: Record<number, OptionKey> = {}
  for (const r of (data ?? []) as { q_ord: number; chosen: OptionKey }[])
    out[r.q_ord] = r.chosen
  return out
}

export async function clearDayAnswers(day: number, source: AnswerSource): Promise<void> {
  const { error } = await getSupabase().rpc('clear_day_answers', {
    p_day: day,
    p_source: source,
  })
  if (error) throw new Error(error.message)
}

// --- Timed test session (replaces the localStorage countdown) ----------------

export interface TestSession {
  endTime: string | null
  secondsLeft: number | null
  running: boolean
  submitted: boolean
}

export async function getTestSession(
  day: number,
  source: 'practice' | 'exam',
): Promise<TestSession | null> {
  const { data, error } = await getSupabase()
    .from('user_test_sessions')
    .select('end_time, seconds_left, running, submitted')
    .eq('day_number', day)
    .eq('source', source)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null
  const r = data as {
    end_time: string | null
    seconds_left: number | null
    running: boolean
    submitted: boolean
  }
  return {
    endTime: r.end_time,
    secondsLeft: r.seconds_left,
    running: r.running,
    submitted: r.submitted,
  }
}

/** Persisted only on meaningful transitions (start/pause/reset/submit), not on every tick. */
export async function saveTestSession(
  day: number,
  source: 'practice' | 'exam',
  s: { endTime: Date | null; secondsLeft: number | null; running: boolean; submitted: boolean },
): Promise<void> {
  const { error } = await getSupabase().rpc('save_test_session', {
    p_day: day,
    p_source: source,
    p_end_time: s.endTime ? s.endTime.toISOString() : null,
    p_seconds_left: s.secondsLeft,
    p_running: s.running,
    p_submitted: s.submitted,
  })
  if (error) throw new Error(error.message)
}

// --- Vocabulary: one answer at a time ---------------------------------------

export async function recordVocabAnswer(itemId: number, correct: boolean): Promise<void> {
  const { error } = await getSupabase().rpc('record_vocab_answer', {
    p_item: itemId,
    p_correct: correct,
  })
  if (error) throw new Error(error.message)
}

// --- Dictation: one line at a time ------------------------------------------

export async function saveDictationLine(
  itemId: number,
  level: number,
  lineOrd: number,
  correct: number,
  total: number,
): Promise<void> {
  const { error } = await getSupabase().rpc('save_dictation_line', {
    p_item: itemId,
    p_level: level,
    p_line: lineOrd,
    p_correct: correct,
    p_total: total,
  })
  if (error) throw new Error(error.message)
}

/** Wipes every roadmap-related progress row for this user. */
export async function resetAllProgress(): Promise<void> {
  const { error } = await getSupabase().rpc('reset_all_progress')
  if (error) throw new Error(error.message)
}

// --- One-time cleanup of the old browser storage -----------------------------

/** Removes every legacy `toeic90:*` key — progress now lives only in the DB. */
export function purgeLegacyLocalStorage(): void {
  if (typeof window === 'undefined') return
  try {
    const doomed: string[] = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i)
      if (k && k.startsWith('toeic90:')) doomed.push(k)
    }
    doomed.forEach((k) => window.localStorage.removeItem(k))
  } catch {
    /* private mode — nothing to clean */
  }
}
