import { useEffect, useState } from 'react'
import {
  BookMarked,
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  Circle,
  Flame,
  Headphones,
  ListChecks,
} from 'lucide-react'
import { cn } from '../lib/cn'
import { getDailyGoals, type DailyGoals, type GoalKey } from '../lib/goalsApi'

interface Props {
  onOpenVocab: () => void
  onOpenParts: () => void
  onOpenDictation: () => void
  onOpenReading: () => void
}

const TASKS: Record<
  GoalKey,
  { label: string; icon: typeof BookMarked; open: keyof Props }
> = {
  vocab: { label: 'Ôn từ vựng', icon: BookMarked, open: 'onOpenVocab' },
  part: { label: 'Luyện 1 bài Part 1–7', icon: ListChecks, open: 'onOpenParts' },
  dictation: { label: 'Nghe chép chính tả', icon: Headphones, open: 'onOpenDictation' },
  reading: { label: 'Ôn Reading', icon: BookOpenCheck, open: 'onOpenReading' },
}

export function TodayPanel(props: Props) {
  const [goals, setGoals] = useState<DailyGoals | null>(null)

  useEffect(() => {
    getDailyGoals()
      .then(setGoals)
      .catch(() => setGoals(null))
  }, [])

  if (!goals) return null
  const done = goals.tasks.filter((t) => t.done).length
  const total = goals.tasks.length

  return (
    <div className="mb-6 animate-fade-slide-up rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              'grid h-11 w-11 place-items-center rounded-xl text-white',
              goals.streak > 0
                ? 'bg-gradient-to-br from-amber-400 to-orange-600'
                : 'bg-slate-300',
            )}
          >
            <Flame className={cn('h-6 w-6', goals.streak > 0 && 'animate-float')} />
          </span>
          <div className="leading-tight">
            <p className="text-2xl font-bold tabular-nums text-slate-900">
              {goals.streak}
              <span className="ml-1 text-sm font-medium text-slate-400">ngày liên tiếp</span>
            </p>
            <p className="text-xs text-slate-500">
              {goals.activeToday
                ? 'Tuyệt vời — hôm nay bạn đã học rồi!'
                : goals.streak > 0
                  ? 'Học một chút hôm nay để giữ chuỗi nhé.'
                  : 'Bắt đầu chuỗi ngày học của bạn hôm nay.'}
            </p>
          </div>
        </div>

        <div className="ml-auto text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Việc hôm nay</p>
          <p className="text-lg font-bold tabular-nums text-emerald-600">
            {done}
            <span className="text-slate-400">/{total}</span>
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
        {goals.tasks.map((t) => {
          const meta = TASKS[t.key]
          if (!meta) return null
          const Icon = meta.icon
          return (
            <button
              key={t.key}
              type="button"
              onClick={props[meta.open]}
              className={cn(
                'press flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-sm transition-colors',
                t.done
                  ? 'border-emerald-200 bg-emerald-50/60 text-slate-500'
                  : 'border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50/40',
              )}
            >
              {t.done ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-slate-300" />
              )}
              <Icon className={cn('h-4 w-4 shrink-0', t.done ? 'text-emerald-500' : 'text-slate-400')} />
              <span className={cn('flex-1 font-medium', t.done && 'line-through')}>{meta.label}</span>
              {!t.done && <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
