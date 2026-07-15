import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/cn'
import { DayItem } from './DayItem'
import type { DayStatus, DaySummary } from '../../data/types'

interface WeekGroupProps {
  week: number
  days: DaySummary[]
  selectedDay: number
  onSelectDay: (dayNumber: number) => void
  getStatus: (dayNumber: number) => DayStatus
}

export function WeekGroup({
  week,
  days,
  selectedDay,
  onSelectDay,
  getStatus,
}: WeekGroupProps) {
  const containsSelected = days.some((d) => d.day === selectedDay)
  const [open, setOpen] = useState(containsSelected)

  // Auto-expand the week that holds the currently selected day.
  useEffect(() => {
    if (containsSelected) setOpen(true)
  }, [containsSelected])

  const doneCount = days.filter((d) => getStatus(d.day) === 'done').length
  const first = days[0].day
  const last = days[days.length - 1].day
  const allDone = doneCount === days.length

  return (
    <section className="border-b border-slate-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="press flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50"
      >
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ease-smooth',
            open ? 'rotate-0' : '-rotate-90',
          )}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800">Tuần {week}</span>
            <span className="text-xs text-slate-400">
              (Ngày {first}–{last})
            </span>
          </div>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
            allDone
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-100 text-slate-500',
          )}
        >
          {doneCount}/{days.length}
        </span>
      </button>

      {open && (
        <div className="stagger space-y-1 px-2 pb-3">
          {days.map((day) => (
            <DayItem
              key={day.day}
              day={day}
              status={getStatus(day.day)}
              isActive={day.day === selectedDay}
              onSelect={onSelectDay}
            />
          ))}
        </div>
      )}
    </section>
  )
}
