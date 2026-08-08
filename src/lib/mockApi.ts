// Đề mô phỏng (mock test) + placement — ghép từ ngân hàng Part 1–7 nguyên gốc.
import { getSupabase } from './supabase'
import type { OptionKey } from './practiceApi'

export type MockScope = 'placement' | 'mini' | 'full'

export interface MockQuestion {
  id: number
  part: number
  image?: string | null
  prompt?: string | null
  stem?: string | null
  blankNo?: number | null
  options: Partial<Record<OptionKey, string>>
}
export interface MockPassage {
  id: number
  part: number
  kind?: string | null
  title?: string | null
  body: string
  questions: MockQuestion[]
}
export interface MockTest {
  scope: MockScope
  standalone: MockQuestion[]
  passages: MockPassage[]
}
export interface MockResult {
  lcCorrect: number
  lcTotal: number
  rcCorrect: number
  rcTotal: number
  estTotal: number
  byPart: { part: number; correct: number; total: number }[]
  review: {
    questionId: number
    part: number
    chosen: OptionKey | null
    correctOption: OptionKey
    correct: boolean
    options: Partial<Record<OptionKey, string>>
    explanation: string | null
  }[]
}
export interface MockAttempt {
  id: number
  scope: MockScope
  lcCorrect: number
  lcTotal: number
  rcCorrect: number
  rcTotal: number
  estTotal: number
  seconds: number | null
  takenAt: string
}

/** Số phút cho mỗi loại đề. */
export const MOCK_MINUTES: Record<MockScope, number> = { placement: 12, mini: 35, full: 120 }
export const MOCK_LABEL: Record<MockScope, string> = {
  placement: 'Test đầu vào',
  mini: 'Đề rút gọn',
  full: 'Đề đầy đủ',
}

export async function getMockTest(scope: MockScope): Promise<MockTest> {
  const { data, error } = await getSupabase().rpc('get_mock_test', { p_scope: scope })
  if (error) throw new Error(error.message)
  const d = (data ?? {}) as Partial<MockTest>
  return { scope, standalone: d.standalone ?? [], passages: d.passages ?? [] }
}

export async function gradeMock(
  scope: MockScope,
  answers: Record<number, OptionKey>,
  seconds: number,
): Promise<MockResult> {
  const { data, error } = await getSupabase().rpc('grade_mock', {
    p_scope: scope,
    p_answers: answers,
    p_seconds: seconds,
  })
  if (error) throw new Error(error.message)
  return data as MockResult
}

export async function getMockHistory(): Promise<MockAttempt[]> {
  const { data, error } = await getSupabase().rpc('get_mock_history')
  if (error) throw new Error(error.message)
  return (data ?? []) as MockAttempt[]
}
