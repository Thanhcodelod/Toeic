import { cn } from '../../lib/cn'
import type { DayStatus } from '../../data/types'

const STATUS_CONFIG: Record<
  DayStatus,
  { label: string; className: string; dot: string }
> = {
  'not-started': {
    label: 'Chưa học',
    className: 'bg-slate-100 text-slate-500',
    dot: 'bg-slate-400',
  },
  'in-progress': {
    label: 'Đang học',
    className: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-500',
  },
  done: {
    label: 'Đã xong',
    className: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-500',
  },
}

interface StatusBadgeProps {
  status: DayStatus
  /** Show only the coloured dot (no text). */
  dotOnly?: boolean
  className?: string
}

export function StatusBadge({ status, dotOnly, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  if (dotOnly) {
    return (
      <span
        className={cn('inline-block h-2 w-2 rounded-full', config.dot, className)}
        title={config.label}
        aria-label={config.label}
      />
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium',
        config.className,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  )
}
