import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
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
    // Khung xương hình dạng đúng thẻ đăng nhập — êm hơn spinner trần, tránh
    // "nhấp nháy" bố cục khi phiên đăng nhập được giải quyết.
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-card animate-fade-in">
          <div className="flex items-center gap-2.5">
            <div className="skeleton h-10 w-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3.5 w-44 rounded" />
              <div className="skeleton h-3 w-28 rounded" />
            </div>
          </div>
          <div className="skeleton mt-6 h-10 w-full rounded-xl" />
          <div className="mt-5 space-y-4">
            <div className="skeleton h-11 w-full rounded-xl" />
            <div className="skeleton h-11 w-full rounded-xl" />
            <div className="skeleton h-11 w-full rounded-xl" />
          </div>
          <span className="sr-only">Đang tải…</span>
        </div>
      </div>
    )
  }

  if (status === 'signed-out') return <AuthScreen />

  return <>{children}</>
}
