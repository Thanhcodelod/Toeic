import { CheckCircle2 } from 'lucide-react'
import { cn } from '../../lib/cn'
import { CONTENT_META } from '../../lib/contentMeta'
import { StatusBadge } from './StatusBadge'
import type { DayStatus, DaySummary } from '../../data/types'

interface DayItemProps {
  day: DaySummary
  status: DayStatus
  isActive: boolean
  onSelect: (dayNumber: number) => void
}

export function DayItem({ day, status, isActive, onSelect }: DayItemProps) {
  const meta = CONTENT_META[day.type]
  const Icon = meta.icon
  const isDone = status === 'done'

  return (
    <button
      type="button"
      onClick={() => onSelect(day.day)}
      aria-current={isActive ? 'true' : undefined}
      className={cn(
        'group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
        isActive
          ? 'bg-brand-50 ring-1 ring-brand-200'
          : 'hover:bg-slate-50',
      )}
    >
      <span
        className={cn(
          'mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg',
          isDone ? 'bg-emerald-100 text-emerald-600' : meta.iconWrap,
        )}
      >
        {isDone ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'text-xs font-semibold',
              isActive ? 'text-brand-700' : 'text-slate-500',
            )}
          >
            Ngày {day.day}
          </span>
          <StatusBadge status={status} />
        </span>
        <span
          className={cn(
            'mt-0.5 block text-sm leading-snug',
            isActive ? 'font-semibold text-slate-900' : 'text-slate-700',
          )}
        >
          {day.title}
        </span>
      </span>
    </button>
  )
}
