// Mục tiêu hằng ngày: streak + checklist việc hôm nay (tự đánh dấu từ hoạt động).
import { getSupabase } from './supabase'

export type GoalKey = 'vocab' | 'part' | 'dictation' | 'reading'

export interface DailyGoals {
  streak: number
  activeToday: boolean
  tasks: { key: GoalKey; done: boolean }[]
}

export async function getDailyGoals(): Promise<DailyGoals> {
  const { data, error } = await getSupabase().rpc('get_daily_goals')
  if (error) throw new Error(error.message)
  const d = (data ?? {}) as Partial<DailyGoals>
  return {
    streak: d.streak ?? 0,
    activeToday: d.activeToday ?? false,
    tasks: d.tasks ?? [],
  }
}
