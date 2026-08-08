// Highlight + ghi chú khi đọc / làm bài. Lưu ở DB (không dùng localStorage).
import { getSupabase } from './supabase'

export interface UserNote {
  id: number
  context: string
  quote: string
  note: string
  createdAt: string
}

export async function saveNote(context: string, quote: string, note = ''): Promise<UserNote> {
  const { data, error } = await getSupabase().rpc('save_note', {
    p_context: context,
    p_quote: quote,
    p_note: note,
  })
  if (error) throw new Error(error.message)
  return data as UserNote
}

export async function getNotes(context: string): Promise<UserNote[]> {
  const { data, error } = await getSupabase().rpc('get_notes', { p_context: context })
  if (error) throw new Error(error.message)
  return (data ?? []) as UserNote[]
}

export async function getAllNotes(): Promise<UserNote[]> {
  const { data, error } = await getSupabase().rpc('get_all_notes')
  if (error) throw new Error(error.message)
  return (data ?? []) as UserNote[]
}

export async function updateNote(id: number, note: string): Promise<void> {
  const { error } = await getSupabase().rpc('update_note', { p_id: id, p_note: note })
  if (error) throw new Error(error.message)
}

export async function deleteNote(id: number): Promise<void> {
  const { error } = await getSupabase().rpc('delete_note', { p_id: id })
  if (error) throw new Error(error.message)
}
