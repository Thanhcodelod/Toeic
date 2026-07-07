import { useState, type FormEvent } from 'react'
import { GraduationCap, Loader2, MailCheck } from 'lucide-react'
import { Tabs } from '../components/common/Tabs'
import { cn } from '../lib/cn'
import { useCountdown } from '../hooks/useCountdown'
import { useAuth } from './AuthContext'

type Mode = 'signin' | 'signup'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const inputClass =
  'w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand-500'

export function AuthScreen() {
  const { signIn, signUp, resendConfirmation } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string
    password?: string
  }>({})
  const [confirmationSent, setConfirmationSent] = useState(false)
  const [showResend, setShowResend] = useState(false)

  // Cooldown for the "resend confirmation" button (~60s).
  const resend = useCountdown({ durationSeconds: 60 })

  const switchMode = (id: string) => {
    setMode(id as Mode)
    setFormError(null)
    setFieldErrors({})
    setConfirmationSent(false)
    setShowResend(false)
  }

  const validate = (): boolean => {
    const errs: { email?: string; password?: string } = {}
    if (!EMAIL_RE.test(email.trim())) errs.email = 'Email không hợp lệ.'
    if (password.length < 6)
      errs.password = 'Mật khẩu phải có ít nhất 6 ký tự.'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setShowResend(false)
    if (!validate()) return
    setSubmitting(true)
    try {
      if (mode === 'signin') {
        const { error } = await signIn(email.trim(), password)
        if (error) {
          setFormError(error)
          if (error.includes('chưa được xác nhận')) setShowResend(true)
        }
      } else {
        const { error, needsConfirmation } = await signUp(email.trim(), password)
        if (error) setFormError(error)
        else if (needsConfirmation) setConfirmationSent(true)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (resend.running) return
    const { error } = await resendConfirmation(email.trim())
    setFormError(error)
    resend.start()
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-card">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <h1 className="text-sm font-bold text-slate-900">
              Lộ trình 90 ngày đạt TOEIC 650+
            </h1>
            <p className="text-xs text-slate-500">Đăng nhập để tiếp tục học</p>
          </div>
        </div>

        {confirmationSent ? (
          <div className="mt-6 flex flex-col items-center text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              <MailCheck className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-slate-800">
              Kiểm tra hộp thư của bạn
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Chúng tôi đã gửi liên kết xác nhận đến <strong>{email}</strong>.
              Bấm vào liên kết để kích hoạt tài khoản, sau đó quay lại đăng nhập
              (kiểm tra cả mục Spam).
            </p>
            {formError && (
              <p className="mt-3 w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
              </p>
            )}
            <button
              type="button"
              onClick={handleResend}
              disabled={resend.running}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {resend.running
                ? `Có thể gửi lại sau ${resend.secondsLeft}s`
                : 'Gửi lại email xác nhận'}
            </button>
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className="mt-3 text-sm font-medium text-brand-700 hover:underline"
            >
              Quay lại đăng nhập
            </button>
          </div>
        ) : (
          <>
            <div className="mt-5">
              <Tabs
                tabs={[
                  { id: 'signin', label: 'Đăng nhập' },
                  { id: 'signup', label: 'Đăng ký' },
                ]}
                active={mode}
                onChange={switchMode}
              />
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    inputClass,
                    fieldErrors.email && 'border-red-400 focus:border-red-400',
                  )}
                  placeholder="ban@email.com"
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-xs text-red-600">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  autoComplete={
                    mode === 'signup' ? 'new-password' : 'current-password'
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(
                    inputClass,
                    fieldErrors.password &&
                      'border-red-400 focus:border-red-400',
                  )}
                  placeholder="••••••"
                />
                {fieldErrors.password ? (
                  <p className="mt-1 text-xs text-red-600">
                    {fieldErrors.password}
                  </p>
                ) : (
                  mode === 'signup' && (
                    <p className="mt-1 text-xs text-slate-400">
                      Tối thiểu 6 ký tự.
                    </p>
                  )
                )}
              </div>

              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                  {showResend && (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resend.running}
                      className="mt-1 block font-semibold text-brand-700 hover:underline disabled:opacity-60"
                    >
                      {resend.running
                        ? `Gửi lại sau ${resend.secondsLeft}s`
                        : 'Gửi lại email xác nhận'}
                    </button>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-card transition-colors hover:bg-brand-700 disabled:opacity-60"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting
                  ? 'Đang xử lý…'
                  : mode === 'signin'
                    ? 'Đăng nhập'
                    : 'Đăng ký'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
