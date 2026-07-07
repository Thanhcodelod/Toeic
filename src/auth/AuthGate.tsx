import type { ReactNode } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { isSupabaseConfigured } from '../lib/supabase'
import { EmptyState } from '../components/common/EmptyState'
import { AuthScreen } from './AuthScreen'
import { useAuth } from './AuthContext'

/**
 * Gates the whole app behind sign-in:
 *  - Supabase not configured → a helpful notice (so it never crashes)
 *  - auth still resolving      → full-screen loader (prevents login-form flash)
 *  - signed out                → the login/signup screen
 *  - signed in                 → the real app (children)
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { status } = useAuth()

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 px-4">
        <EmptyState
          icon={AlertTriangle}
          title="Chưa cấu hình Supabase"
          description="Tạo file .env trong thư mục fe/ với VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY rồi khởi động lại."
        />
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-400">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Đang tải…
        </span>
      </div>
    )
  }

  if (status === 'signed-out') return <AuthScreen />

  return <>{children}</>
}
