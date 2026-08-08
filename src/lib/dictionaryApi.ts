// Tra từ: ưu tiên kho từ của app (miễn phí, có ngay); nếu không có thì gọi AI dịch.
import { getSupabase } from './supabase'
import { searchVocab } from './vocabExtrasApi'

export interface WordLookup {
  word: string
  ipa: string | null
  wordForm: string | null
  meaning: string
  example: string | null
  exampleTranslation: string | null
  source: 'bank' | 'ai'
}

export async function lookupWord(word: string, context?: string): Promise<WordLookup> {
  const w = word.trim().toLowerCase()
  // 1) khớp chính xác trong kho từ
  const hits = await searchVocab(w, 5)
  const exact = hits.find((h) => h.word.toLowerCase() === w)
  if (exact) {
    return {
      word: exact.word,
      ipa: exact.ipa,
      wordForm: exact.wordForm,
      meaning: exact.meaning,
      example: exact.example,
      exampleTranslation: exact.exampleTranslation,
      source: 'bank',
    }
  }
  // 2) nhờ AI dịch
  const { data, error } = await getSupabase().functions.invoke('translate-word', {
    body: { word: w, context },
  })
  if (error) throw new Error(error.message)
  const d = (data ?? {}) as Partial<WordLookup> & { error?: string }
  if (d.error) throw new Error(d.error)
  return {
    word: d.word ?? w,
    ipa: d.ipa ?? null,
    wordForm: d.wordForm ?? null,
    meaning: d.meaning ?? '(không tra được)',
    example: d.example ?? null,
    exampleTranslation: d.exampleTranslation ?? null,
    source: 'ai',
  }
}
