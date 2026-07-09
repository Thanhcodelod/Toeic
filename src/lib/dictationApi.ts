// Data access for "Nghe chép chính tả" (dictation). Content tables are
// public-read; progress goes through RLS-scoped RPCs.
import { getSupabase } from './supabase'

export interface DictationTest {
  id: number
  code: string
  title: string
}

export interface DictationItem {
  id: number
  part: number
  qFrom: number
  qTo: number
  audioPath: string
  ord: number
}

export interface DictationLine {
  ord: number
  speaker: string | null
  label: string | null
  text: string
}

export interface DictationStats {
  totalItems: number
  doneItems: number
}

export async function getDictationTests(): Promise<DictationTest[]> {
  const { data, error } = await getSupabase()
    .from('dictation_tests')
    .select('id, code, title')
    .order('ord', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as DictationTest[]
}

export async function getDictationItems(testId: number): Promise<DictationItem[]> {
  const { data, error } = await getSupabase()
    .from('dictation_items')
    .select('id, part, q_from, q_to, audio_path, ord')
    .eq('test_id', testId)
    .order('ord', { ascending: true })
  if (error) throw new Error(error.message)
  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    id: r.id as number,
    part: r.part as number,
    qFrom: r.q_from as number,
    qTo: r.q_to as number,
    audioPath: r.audio_path as string,
    ord: r.ord as number,
  }))
}

export async function getDictationLines(itemId: number): Promise<DictationLine[]> {
  const { data, error } = await getSupabase()
    .from('dictation_lines')
    .select('ord, speaker, label, text')
    .eq('item_id', itemId)
    .order('ord', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as DictationLine[]
}

/** Public URL of a clip inside the `ets-files` bucket. */
export function dictationAudioUrl(path: string): string {
  return getSupabase().storage.from('ets-files').getPublicUrl(path).data.publicUrl
}

export async function recordDictationResult(
  itemId: number,
  level: number,
  correct: number,
  total: number,
): Promise<void> {
  const { error } = await getSupabase().rpc('record_dictation_result', {
    p_item: itemId,
    p_level: level,
    p_correct: correct,
    p_total: total,
  })
  if (error) throw new Error(error.message)
}

export async function getDictationStats(testId: number): Promise<DictationStats> {
  const { data, error } = await getSupabase().rpc('get_dictation_stats', {
    p_test_id: testId,
  })
  if (error) throw new Error(error.message)
  const d = (data ?? {}) as { total_items?: number; done_items?: number }
  return { totalItems: d.total_items ?? 0, doneItems: d.done_items ?? 0 }
}

/** Which items the user has completed (any level) — for the item list badges. */
export async function getCompletedItemIds(): Promise<Set<number>> {
  const { data, error } = await getSupabase()
    .from('user_dictation_progress')
    .select('item_id')
    .eq('completed', true)
  if (error) throw new Error(error.message)
  return new Set(((data ?? []) as { item_id: number }[]).map((r) => r.item_id))
}
