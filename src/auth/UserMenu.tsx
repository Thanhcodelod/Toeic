import { useEffect, useRef, useState } from 'react'
import { ChevronDown, LogOut, User as UserIcon } from 'lucide-react'
import { cn } from '../lib/cn'
import { getProfile, type Profile } from '../lib/answersApi'
import { useAuth } from './AuthContext'

/** Header account menu: shows the email + a "Đăng xuất" action. */
export function UserMenu({ compact = false }: { compact?: boolean }) {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // Account row lives in the `profiles` table (created by a DB trigger on signup).
  useEffect(() => {
    let ignore = false
    getProfile()
      .then((p) => !ignore && setProfile(p))
      .catch(() => {})
    return () => {
      ignore = true
    }
  }, [user?.id])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const email = profile?.email ?? user?.email ?? 'Tài khoản'
  const name = profile?.displayName || email

  const handleSignOut = () => {
    setOpen(false)
    void signOut()
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-50',
          compact ? 'h-9 w-9 justify-center' : 'px-3 py-2',
        )}
        title={email}
      >
        <UserIcon className="h-4 w-4 shrink-0" />
        {!compact && (
          <>
            <span className="max-w-[10rem] truncate">{name}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
          </>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-52 rounded-xl border border-slate-200 bg-white p-1 shadow-card-lg"
        >
          <div className="px-3 py-2">
            {profile?.displayName && (
              <p className="truncate text-sm font-semibold text-slate-700">
                {profile.displayName}
              </p>
            )}
            <p className="truncate text-xs text-slate-400">{email}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  )
}
