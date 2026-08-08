// Mục tiêu điểm & lộ trình cá nhân hoá. Lưu ở DB (không dùng localStorage).
import { getSupabase } from './supabase'

export interface TargetInfo {
  targetScore: number
  targetDate: string | null
}

export async function getTarget(): Promise<TargetInfo | null> {
  const { data, error } = await getSupabase().rpc('get_target')
  if (error) throw new Error(error.message)
  return (data ?? null) as TargetInfo | null
}

export async function setTarget(score: number, date: string | null): Promise<TargetInfo> {
  const { data, error } = await getSupabase().rpc('set_target', { p_score: score, p_date: date })
  if (error) throw new Error(error.message)
  return data as TargetInfo
}
