import { Gauge } from 'lucide-react'
import { cn } from '../../lib/cn'
import { RATES, usePlaybackRate } from '../../lib/playback'

/** Chọn tốc độ phát (0.5×–2×) — áp dụng chung cho mọi trình phát nghe. */
export function SpeedControl({ className }: { className?: string }) {
  const [rate, setRate] = usePlaybackRate()
  return (
    <div
      className={cn('inline-flex items-center gap-1 rounded-lg bg-slate-100 p-0.5', className)}
      role="group"
      aria-label="Tốc độ phát"
    >
      <Gauge className="ml-1 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
      {RATES.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => setRate(r)}
          aria-pressed={rate === r}
          className={cn(
            'press rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums transition-colors',
            rate === r ? 'bg-white text-brand-700 shadow-card' : 'text-slate-500 hover:text-slate-700',
          )}
        >
          {r}×
        </button>
      ))}
    </div>
  )
}
