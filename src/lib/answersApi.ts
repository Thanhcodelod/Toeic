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

/**
 * ÔN TẬP ngắt quãng: đúng → lên 1 cấp (hẹn ôn xa hơn), sai → tụt 1 cấp (ôn ngay).
 * Trả về cấp độ mới do SERVER quyết định.
 */
export async function answerVocab(itemId: number, correct: boolean): Promise<number> {
  const { data, error } = await getSupabase().rpc('answer_vocab', {
    p_item: itemId,
    p_correct: correct,
  })
  if (error) throw new Error(error.message)
  return Number(data ?? 0)
}

export interface VocabCheckResult {
  /** 0 Chưa học · 1 Mới học · … · 5 Thông thạo */
  level: number
  /** Số DẠNG câu hỏi đã trả lời đúng. */
  checks: number
  /** Số dạng cần qua để tốt nghiệp (server tự kẹp trong [4..6]). */
  need: number
  kindsOk: string[]
  /** checks >= need — từ này đã qua, không hỏi lại nữa. */
  passed: boolean
  timesTested: number
  timesCorrect: number
  dueAt: string | null
}

/**
 * BÀI HỌC: trả lời một câu ở một DẠNG cụ thể.
 * Server ghi dạng vào `kinds_ok` (đúng) hoặc gỡ ra (sai), và tự tốt nghiệp từ
 * 0 → 1 khi đã qua đủ 6 dạng khác nhau. `pool` = số dạng client phục vụ được.
 */
export async function answerVocabCheck(
  itemId: number,
  kind: string,
  correct: boolean,
  pool: number,
): Promise<VocabCheckResult> {
  const { data, error } = await getSupabase().rpc('answer_vocab_check', {
    p_item: itemId,
    p_kind: kind,
    p_correct: correct,
    p_pool: pool,
  })
  if (error) throw new Error(error.message)
  const d = (data ?? {}) as Record<string, unknown>
  return {
    level: Number(d.level ?? 0),
    checks: Number(d.checks ?? 0),
    need: Number(d.need ?? 6),
    kindsOk: (d.kindsOk as string[]) ?? [],
    passed: Boolean(d.passed),
    timesTested: Number(d.timesTested ?? 0),
    timesCorrect: Number(d.timesCorrect ?? 0),
    dueAt: (d.dueAt as string | null) ?? null,
  }
}

export interface VocabWordProgress {
  /** 0 chưa học · 1 Mới học · 2 Nhớ tạm · 3 Nhớ lâu · 4 Thuộc lòng · 5 Thông thạo */
  level: number
  /** Các DẠNG câu hỏi đã trả lời đúng cho từ này. */
  kindsOk: string[]
  timesTested: number
  timesCorrect: number
  mastered: boolean
  dueAt: string | null
}

/** Mastery of specific words (for the day's deck) — read straight from the DB. */
export async function getVocabProgressFor(
  itemIds: number[],
): Promise<Record<number, VocabWordProgress>> {
  if (itemIds.length === 0) return {}
  const { data, error } = await getSupabase()
    .from('user_vocab_progress')
    .select(
      'vocab_item_id, level, kinds_ok, times_tested, times_correct, mastered, due_at',
    )
    .in('vocab_item_id', itemIds)
  if (error) throw new Error(error.message)
  const out: Record<number, VocabWordProgress> = {}
  for (const r of (data ?? []) as {
    vocab_item_id: number
    level: number
    kinds_ok: string[] | null
    times_tested: number
    times_correct: number
    mastered: boolean
    due_at: string | null
  }[]) {
    out[r.vocab_item_id] = {
      level: r.level,
      kindsOk: r.kinds_ok ?? [],
      timesTested: r.times_tested,
      timesCorrect: r.times_correct,
      mastered: r.mastered,
      dueAt: r.due_at,
    }
  }
  return out
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
