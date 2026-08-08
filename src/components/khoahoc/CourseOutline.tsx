import { useEffect, useState } from 'react'
import {
  BookOpen,
  BookText,
  CheckCircle2,
  ChevronDown,
  Circle,
  CircleDot,
  FileText,
  Headphones,
  Image,
  Layers,
  MessageCircleQuestion,
  Mic,
  PencilRuler,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import type { CourseOutline as COutline, OutlineLesson, OutlineSection } from '../../lib/courseApi'

const SECTION_ICON: Record<string, LucideIcon> = {
  BookText,
  Layers,
  Headphones,
  Image,
  MessageCircleQuestion,
  Users,
  Mic,
  PencilRuler,
  FileText,
  BookOpen,
  Trophy,
}

const statusIcon = (s: OutlineLesson['status']) =>
  s === 'done' ? CheckCircle2 : s === 'in-progress' ? CircleDot : Circle

export function CourseOutline({
  outline,
  activeKey,
  onPick,
}: {
  outline: COutline
  activeKey: string | null
  onPick: (key: string) => void
}) {
  const pct = outline.totalLessons ? Math.round((100 * outline.doneLessons) / outline.totalLessons) : 0
  return (
    <div>
      <div className="border-b border-slate-200 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tiến độ của bạn</p>
        <p className="mt-1 text-sm font-bold text-slate-900">
          {outline.doneLessons}/{outline.totalLessons} bài học
          <span className="ml-2 text-xs font-medium text-teal-600">{pct}%</span>
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="bar-fill h-full rounded-full bg-teal-500" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <nav className="p-2">
        {outline.sections.map((s) => (
          <SectionGroup key={s.key} section={s} activeKey={activeKey} onPick={onPick} />
        ))}
      </nav>
    </div>
  )
}

function SectionGroup({
  section,
  activeKey,
  onPick,
}: {
  section: OutlineSection
  activeKey: string | null
  onPick: (key: string) => void
}) {
  const containsActive = section.lessons.some((l) => l.key === activeKey)
  const [open, setOpen] = useState(containsActive)
  useEffect(() => {
    if (containsActive) setOpen(true)
  }, [containsActive])

  const Icon = SECTION_ICON[section.icon ?? ''] ?? BookOpen
  const allDone = section.total > 0 && section.done === section.total

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="press flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-slate-100"
      >
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-slate-800">{section.title}</span>
        </span>
        <span
          className={cn(
            'shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums',
            allDone ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500',
          )}
        >
          {section.done}/{section.total}
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <ul className="ml-4 mt-0.5 space-y-0.5 border-l border-slate-200 pl-2">
          {section.lessons.map((l) => {
            const SIcon = statusIcon(l.status)
            const isActive = l.key === activeKey
            return (
              <li key={l.key}>
                <button
                  type="button"
                  onClick={() => onPick(l.key)}
                  className={cn(
                    'press flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm',
                    isActive ? 'bg-teal-50 font-semibold text-teal-800' : 'text-slate-600 hover:bg-slate-50',
                  )}
                >
                  <SIcon
                    className={cn(
                      'h-4 w-4 shrink-0',
                      l.status === 'done' ? 'text-emerald-500' : l.status === 'in-progress' ? 'text-amber-500' : 'text-slate-300',
                    )}
                  />
                  <span className="min-w-0 flex-1 truncate">{l.title}</span>
                  {l.quizBest != null && (
                    <span className="shrink-0 text-[10px] font-semibold tabular-nums text-slate-400">{l.quizBest}%</span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
