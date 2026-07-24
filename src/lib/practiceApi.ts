// Ôn tập Part 1–7 — ngân hàng câu hỏi NGUYÊN GỐC (không sao chép ETS).
// Mọi bài làm do SERVER chấm và lưu vào DB; không có gì ở localStorage.

import { getSupabase } from './supabase'

export type OptionKey = 'A' | 'B' | 'C' | 'D'
export type Part = 1 | 2 | 3 | 4 | 5 | 6 | 7

export const PART_META: Record<
  Part,
  { label: string; skill: 'Nghe' | 'Đọc'; hint: string; hasImage?: boolean; hasAudio?: boolean }
> = {
  1: { label: 'Part 1 · Mô tả tranh', skill: 'Nghe', hint: 'Nghe 4 câu, chọn câu tả đúng ảnh', hasImage: true, hasAudio: true },
  2: { label: 'Part 2 · Hỏi–đáp', skill: 'Nghe', hint: 'Nghe câu hỏi, chọn câu đáp phù hợp', hasAudio: true },
  3: { label: 'Part 3 · Hội thoại', skill: 'Nghe', hint: 'Nghe đoạn hội thoại, trả lời 3 câu', hasAudio: true },
  4: { label: 'Part 4 · Bài nói', skill: 'Nghe', hint: 'Nghe bài nói, trả lời 3 câu', hasAudio: true },
  5: { label: 'Part 5 · Điền câu', skill: 'Đọc', hint: 'Chọn từ/cấu trúc điền vào chỗ trống' },
  6: { label: 'Part 6 · Điền đoạn', skill: 'Đọc', hint: 'Điền 4 chỗ trống trong một đoạn văn' },
  7: { label: 'Part 7 · Đọc hiểu', skill: 'Đọc', hint: 'Đọc đoạn văn, trả lời câu hỏi' },
}

export const PARTS: Part[] = [1, 2, 3, 4, 5, 6, 7]

export interface PtLesson {
  lesson: number
  total: number
  attempted: number
  correct: number
  fromNo: number
  toNo: number
  /** Điểm khó trung bình của bài (0–100) — tăng dần về các bài cuối. */
  avgDiff: number
}

/** Nhãn độ khó từ điểm trung bình. */
export function diffLabel(score: number): { text: string; cls: string } {
  if (score < 40) return { text: 'Dễ', cls: 'bg-emerald-100 text-emerald-700' }
  if (score < 62) return { text: 'Vừa', cls: 'bg-amber-100 text-amber-700' }
  return { text: 'Khó', cls: 'bg-rose-100 text-rose-700' }
}

export interface PtQuestion {
  id: number
  ord: number
  image?: string | null // Part 1: path trong bucket practice-media
  prompt?: string | null // Part 2: câu hỏi được đọc
  blankNo?: number | null // Part 6
  stem?: string | null
  options: Partial<Record<OptionKey, string>>
  done: boolean
  chosen: OptionKey | null
}

export interface PtPassage {
  id: number
  kind: string | null
  title: string | null
  body: string
  questions: PtQuestion[]
}

export interface PtLessonContent {
  part: Part
  lesson: number
  passages: PtPassage[]
  questions: PtQuestion[]
}

export interface PtAnswer {
  correct: boolean
  correctOption: OptionKey
  explanation: string | null
  options: Record<OptionKey, string>
}

export type PtStats = Record<string, { total: number; attempted: number; correct: number }>

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await getSupabase().rpc(fn, args)
  if (error) throw new Error(error.message)
  return data as T
}

export const getPtLessons = (part: Part) =>
  rpc<PtLesson[]>('get_pt_lessons', { p_part: part })

export const getPtLesson = (part: Part, lesson: number) =>
  rpc<PtLessonContent>('get_pt_lesson', { p_part: part, p_lesson: lesson })

/** Gửi đáp án; SERVER tra đáp án đúng và chấm — trả về đúng/sai + lời giải. */
export const answerPt = (questionId: number, chosen: OptionKey) =>
  rpc<PtAnswer>('answer_pt', { p_question: questionId, p_chosen: chosen })

export const getPtStats = () => rpc<PtStats>('get_pt_stats', {})

/** URL công khai của ảnh Part 1 trong bucket practice-media. */
export function practiceImageUrl(path: string): string {
  return getSupabase().storage.from('practice-media').getPublicUrl(path).data.publicUrl
}
