// Vocab: đánh dấu "đã biết" + tra cứu/duyệt kho từ.
import { getSupabase } from './supabase'

export interface VocabRef {
  id: number
  word: string
  wordForm: string
  ipa: string
  meaning: string
  example: string | null
  exampleTranslation: string | null
  level: number
}

export async function setVocabKnown(itemId: number): Promise<number> {
  const { data, error } = await getSupabase().rpc('set_vocab_known', { p_item: itemId })
  if (error) throw new Error(error.message)
  return Number(data ?? 5)
}

export async function searchVocab(query: string, limit = 60): Promise<VocabRef[]> {
  const { data, error } = await getSupabase().rpc('search_vocab', {
    p_query: query || null,
    p_limit: limit,
  })
  if (error) throw new Error(error.message)
  return (data ?? []) as VocabRef[]
}
