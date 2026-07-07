// Maps Supabase auth errors to friendly Vietnamese messages. Returns null on
// success (no error). Checks error `code` first, then message substrings, then
// HTTP status — the raw error is logged for debugging.

interface MaybeAuthError {
  code?: string
  message?: string
  status?: number
  name?: string
}

export function mapAuthError(error: unknown): string | null {
  if (!error) return null
  const e = error as MaybeAuthError
  const code = (e.code ?? '').toLowerCase()
  const msg = (e.message ?? '').toLowerCase()
  const status = e.status ?? 0

  if (code === 'invalid_credentials' || msg.includes('invalid login credentials'))
    return 'Email hoặc mật khẩu không đúng.'

  if (code === 'email_not_confirmed' || msg.includes('email not confirmed'))
    return 'Email chưa được xác nhận. Vui lòng mở email và bấm liên kết xác nhận (kiểm tra cả mục Spam).'

  if (
    code === 'user_already_exists' ||
    msg.includes('already registered') ||
    msg.includes('already been registered')
  )
    return 'Email này đã được đăng ký. Hãy đăng nhập.'

  if (code === 'weak_password' || msg.includes('password should be at least'))
    return 'Mật khẩu phải có ít nhất 6 ký tự.'

  if (
    code === 'over_email_send_rate_limit' ||
    status === 429 ||
    msg.includes('rate limit') ||
    msg.includes('for security purposes')
  )
    return 'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.'

  if (e.name === 'AuthRetryableFetchError' || msg.includes('failed to fetch'))
    return 'Không kết nối được máy chủ. Kiểm tra mạng và thử lại.'

  console.warn('Auth error:', error)
  return 'Có lỗi xảy ra. Vui lòng thử lại.'
}
