// Luyện Writing + chấm AI (qua edge function grade-writing).
import { getSupabase } from './supabase'

export interface WritingPrompt {
  id: number
  kind: 'email' | 'opinion'
  title: string
  prompt: string
  minWords: number
  difficulty: number
}

export interface WritingScore {
  overall: number | null
  scores?: { task: number; grammar: number; vocabulary: number; coherence: number }
  feedback: string
  corrections: { original: string; fixed: string; note: string }[]
  modelAnswer: string
}

export async function getWritingPrompts(): Promise<WritingPrompt[]> {
  const { data, error } = await getSupabase().rpc('get_writing_prompts')
  if (error) throw new Error(error.message)
  return (data ?? []) as WritingPrompt[]
}

export async function gradeWriting(prompt: string, text: string): Promise<WritingScore> {
  const { data, error } = await getSupabase().functions.invoke('grade-writing', {
    body: { prompt, text },
  })
  if (error) throw new Error(error.message)
  const d = (data ?? {}) as Partial<WritingScore> & { error?: string }
  if (d.error) throw new Error(d.error)
  return {
    overall: d.overall ?? null,
    scores: d.scores,
    feedback: d.feedback ?? '',
    corrections: d.corrections ?? [],
    modelAnswer: d.modelAnswer ?? '',
  }
}

export async function saveWriting(
  promptId: number,
  text: string,
  score: WritingScore,
): Promise<void> {
  const { error } = await getSupabase().rpc('save_writing', {
    p_prompt: promptId,
    p_text: text,
    p_score: score,
  })
  if (error) throw new Error(error.message)
}
