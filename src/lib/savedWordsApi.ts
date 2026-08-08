// Sổ tay từ — lưu từ bấm chọn khi nghe (transcript) để ôn sau.
import { getSupabase } from './supabase'

export interface SavedWord {
  id: number
  word: string
  context: string | null
  createdAt: string
  matched: boolean
  meaning: string | null
  ipa: string | null
  wordForm: string | null
  example: string | null
  exampleTranslation: string | null
}

export async function saveWord(word: string, context?: string): Promise<SavedWord> {
  const { data, error } = await getSupabase().rpc('save_word', {
    p_word: word,
    p_context: context ?? null,
  })
  if (error) throw new Error(error.message)
  return data as SavedWord
}

export async function getSavedWords(): Promise<SavedWord[]> {
  const { data, error } = await getSupabase().rpc('get_saved_words')
  if (error) throw new Error(error.message)
  return (data ?? []) as SavedWord[]
}

export async function deleteSavedWord(id: number): Promise<void> {
  const { error } = await getSupabase().rpc('delete_saved_word', { p_id: id })
  if (error) throw new Error(error.message)
}
