// Ôn Reading (Part 5 & 6) — 3 dạng bài bổ trợ.
// Mọi bài làm đều do SERVER chấm và lưu vào DB; không có gì ở localStorage.

import { getSupabase } from './supabase'

export type ReadingKind = 'parse' | 'wordform' | 'reverse'
export type ParseRole = 'S' | 'V' | 'O' | 'C' | 'PREP' | 'REL' | 'ADV' | 'CONJ'
export type WordForm = 'n' | 'v' | 'adj' | 'adv'

export const ROLE_LABEL: Record<ParseRole, string> = {
  S: 'Chủ ngữ',
  V: 'Động từ chính',
  O: 'Tân ngữ',
  C: 'Bổ ngữ',
  PREP: 'Cụm giới từ',
  REL: 'Mệnh đề quan hệ',
  ADV: 'Trạng ngữ',
  CONJ: 'Liên từ',
}

/** Màu theo vai trò — lõi câu (S/V/O) đậm, phần bổ trợ nhạt. */
export const ROLE_STYLE: Record<ParseRole, string> = {
  S: 'bg-blue-100 text-blue-800 border-blue-300',
  V: 'bg-rose-100 text-rose-800 border-rose-300',
  O: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  C: 'bg-teal-100 text-teal-800 border-teal-300',
  PREP: 'bg-amber-50 text-amber-700 border-amber-200',
  REL: 'bg-violet-50 text-violet-700 border-violet-200',
  ADV: 'bg-slate-100 text-slate-600 border-slate-300',
  CONJ: 'bg-orange-50 text-orange-700 border-orange-200',
}

export const ROLES: ParseRole[] = ['S', 'V', 'O', 'C', 'PREP', 'REL', 'ADV', 'CONJ']

export const FORM_LABEL: Record<WordForm, string> = {
  n: 'Danh từ',
  v: 'Động từ',
  adj: 'Tính từ',
  adv: 'Trạng từ',
}

// ---- Bài tập -----------------------------------------------------------------

export interface ParseDrill {
  id: number
  key: string
  sentence: string
  difficulty: number
  chunks: { ord: number; text: string }[]
  bestPct: number
  attempts: number
}

export interface ParseResult {
  total: number
  correct: number
  pct: number
  chunks: {
    ord: number
    text: string
    role: ParseRole
    given: ParseRole | null
    ok: boolean
  }[]
  core: string
  translation: string
  tip: string | null
}

export interface WordFormDrill {
  id: number
  key: string
  root: string
  meaning: string
  difficulty: number
  slots: { form: WordForm; hint: string | null }[]
  bestPct: number
  attempts: number
}

export interface WordFormResult {
  total: number
  correct: number
  pct: number
  slots: {
    form: WordForm
    answers: string[]
    hint: string | null
    example: string | null
    given: string | null
    ok: boolean
  }[]
}

export interface ReverseDrill {
  id: number
  key: string
  english: string
  vietnamese: string
  structure: string | null
  grammarPoint: string | null
  difficulty: number
  bestPct: number
  attempts: number
}

export interface ReverseResult {
  pct: number
  keywordsTotal: number
  keywordsHit: number
  keywords: { kw: string; ok: boolean }[]
  overlapPct: number
  english: string
  structure: string | null
  grammarPoint: string | null
}

export interface KindStats {
  total: number
  attempted: number
  mastered: number
}
export interface ReadingStats {
  parse: KindStats
  wordform: KindStats
  reverse: KindStats
}

// ---- RPC ---------------------------------------------------------------------

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await getSupabase().rpc(fn, args)
  if (error) throw new Error(error.message)
  return data as T
}

export const getParseDrills = (limit = 10) =>
  rpc<ParseDrill[]>('get_reading_drills', { p_kind: 'parse', p_limit: limit })

export const getWordFormDrills = (limit = 10) =>
  rpc<WordFormDrill[]>('get_reading_drills', { p_kind: 'wordform', p_limit: limit })

export const getReverseDrills = (limit = 10) =>
  rpc<ReverseDrill[]>('get_reading_drills', { p_kind: 'reverse', p_limit: limit })

/** Gửi nhãn từng cụm; SERVER so với đáp án và chấm. */
export const answerParse = (itemId: number, labels: Record<number, ParseRole>) =>
  rpc<ParseResult>('answer_parse', { p_item: itemId, p_labels: labels })

/** Gửi 4 dạng từ đã gõ; SERVER chấp nhận mọi biến thể đúng. */
export const answerWordForm = (itemId: number, answers: Record<string, string>) =>
  rpc<WordFormResult>('answer_wordform', { p_item: itemId, p_answers: answers })

/** Gửi câu tiếng Anh viết lại; SERVER chấm từ khoá cấu trúc + độ trùng khớp. */
export const answerReverse = (itemId: number, text: string) =>
  rpc<ReverseResult>('answer_reverse', { p_item: itemId, p_text: text })

export const getReadingStats = () => rpc<ReadingStats>('get_reading_stats', {})
