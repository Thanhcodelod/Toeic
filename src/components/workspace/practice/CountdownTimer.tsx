import { Pause, Play, TimerIcon } from 'lucide-react'
import { cn } from '../../../lib/cn'

interface CountdownTimerProps {
  formatted: string
  secondsLeft: number
  totalSeconds: number
  running: boolean
  onStart: () => void
  onPause: () => void
  /** Hide the start/pause control (e.g. after submitting). */
  locked?: boolean
}

export function CountdownTimer({
  formatted,
  secondsLeft,
  totalSeconds,
  running,
  onStart,
  onPause,
  locked = false,
}: CountdownTimerProps) {
  const ratio = totalSeconds > 0 ? secondsLeft / totalSeconds : 0
  const isExpired = secondsLeft === 0
  const urgency =
    isExpired || ratio <= 0.1
      ? 'danger'
      : ratio <= 0.25
        ? 'warning'
        : 'normal'

  const color = {
    normal: 'text-brand-700',
    warning: 'text-amber-600',
    danger: 'text-rose-600',
  }[urgency]

  const barColor = {
    normal: 'bg-brand-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
  }[urgency]

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <TimerIcon className="h-4 w-4" />
          Thời gian còn lại
        </span>
        {!locked && (
          <button
            type="button"
            onClick={running ? onPause : onStart}
            disabled={isExpired}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-colors',
              running
                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                : 'bg-brand-600 text-white hover:bg-brand-700',
              isExpired && 'cursor-not-allowed opacity-50',
            )}
          >
            {running ? (
              <>
                <Pause className="h-3.5 w-3.5" /> Tạm dừng
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" /> {secondsLeft < totalSeconds ? 'Tiếp tục' : 'Bắt đầu'}
              </>
            )}
          </button>
        )}
      </div>

      <p
        className={cn(
          'mt-1 text-center font-mono text-4xl font-bold tabular-nums',
          color,
          urgency === 'danger' && running && 'animate-pulse',
        )}
      >
        {isExpired ? 'Hết giờ' : formatted}
      </p>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn('h-full rounded-full transition-[width] duration-500', barColor)}
          style={{ width: `${Math.max(0, ratio * 100)}%` }}
        />
      </div>
    </div>
  )
}
