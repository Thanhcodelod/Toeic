// Thống kê học tập — đọc từ RPC get_learning_stats (server tổng hợp).
import { getSupabase } from './supabase'

export interface LearningStats {
  overall: { answered: number; correct: number; activeDays: number; streak: number }
  byPart: { part: number; answered: number; correct: number; accuracy: number }[]
  bySource: { source: string; answered: number; correct: number; accuracy: number }[]
  byReadingKind: { kind: string; attempted: number; mastered: number }[]
  progress: {
    daysDone: number
    vocabStarted: number
    vocabMastered: number
    vocabTotal: number
    dictationDone: number
    readingMastered: number
  }
  activity: { date: string; count: number }[]
}

export async function getLearningStats(): Promise<LearningStats> {
  const { data, error } = await getSupabase().rpc('get_learning_stats')
  if (error) throw new Error(error.message)
  const d = (data ?? {}) as Partial<LearningStats>
  return {
    overall: d.overall ?? { answered: 0, correct: 0, activeDays: 0, streak: 0 },
    byPart: d.byPart ?? [],
    bySource: d.bySource ?? [],
    byReadingKind: d.byReadingKind ?? [],
    progress:
      d.progress ?? {
        daysDone: 0,
        vocabStarted: 0,
        vocabMastered: 0,
        vocabTotal: 0,
        dictationDone: 0,
        readingMastered: 0,
      },
    activity: d.activity ?? [],
  }
}

export const READING_KIND_LABEL: Record<string, string> = {
  parse: 'Phân tích câu',
  wordform: 'Biến đổi từ loại',
  reverse: 'Dịch ngược',
}
export const SOURCE_LABEL: Record<string, string> = {
  grammar: 'Ngữ pháp',
  practice: 'Luyện đề',
  exam: 'Thi thử',
}
