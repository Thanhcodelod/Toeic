import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** True when both env vars are present (build-time inlined). */
export const isSupabaseConfigured = Boolean(url && anonKey)

const client: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        // Keep the session across reloads so RLS `auth.uid()` resolves and the
        // user stays signed in. `detectSessionInUrl` consumes the token returned
        // by the email-confirmation link. flowType stays default (implicit) so
        // the confirmation link works even when opened on another device.
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

/** Returns the Supabase client or throws a friendly, actionable error. */
export function getSupabase(): SupabaseClient {
  if (!client) {
    throw new Error(
      'Chưa cấu hình Supabase. Tạo file .env trong thư mục fe/ với VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY rồi khởi động lại.',
    )
  }
  return client
}
