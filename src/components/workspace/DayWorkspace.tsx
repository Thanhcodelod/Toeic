import { useState, type ReactNode } from 'react'
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Circle,
  Clock,
  Hourglass,
  Layers,
  PencilLine,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { CONTENT_META } from '../../lib/contentMeta'
import { EmptyState } from '../common/EmptyState'
import { Tabs } from '../common/Tabs'
import { TheoryTab } from './grammar/TheoryTab'
import { QuizTab } from './grammar/QuizTab'
import { VocabSection } from './vocabulary/VocabSection'
import { PracticeView } from './practice/PracticeView'
import { ExamView } from './exam/ExamView'
import { MistakeReview } from './exam/MistakeReview'
import { TOTAL_DAYS } from '../../data/constants'
import type { Day } from '../../data/types'
import type { UseProgress } from '../../hooks/useProgress'

interface DayWorkspaceProps {
  day: Day
  progress: UseProgress
  onSelectDay: (dayNumber: number) => void
}

interface Panel {
  id: string
  label: string
  icon: LucideIcon
  node: ReactNode
}

export function DayWorkspace({ day, progress, onSelectDay }: DayWorkspaceProps) {
  const meta = CONTENT_META[day.type]
  const Icon = meta.icon
  const status = progress.getStatus(day.day)
  const isDone = status === 'done'

  // Build the list of content panels this day has (a day may have several).
  const panels: Panel[] = []
  if (day.grammar) {
    panels.push({
      id: 'theory',
      label: 'Lý thuyết',
      icon: BookOpen,
      node: <TheoryTab content={day.grammar} />,
    })
    panels.push({
      id: 'quiz',
      label: 'Luyện tập',
      icon: PencilLine,
      node: (
        <QuizTab
          dayNumber={day.day}
          quiz={day.grammar.quiz}
          savedAnswers={progress.getSavedAnswers(day.day)}
          onComplete={(scorePct, answers) =>
            progress.recordPractice(day.day, scorePct, answers)
          }
        />
      ),
    })
  }
  if (day.exam) {
    panels.push({
      id: 'exam',
      label: 'Thi thử',
      icon: ClipboardList,
      node: (
        <ExamView
          dayNumber={day.day}
          title={day.title}
          content={day.exam}
          progress={progress}
        />
      ),
    })
  } else if (day.practice) {
    panels.push({
      id: 'practice',
      label: 'Luyện đề',
      icon: ClipboardList,
      node: (
        <PracticeView
          dayNumber={day.day}
          title={day.title}
          content={day.practice}
          progress={progress}
        />
      ),
    })
  }
  if (day.vocabulary) {
    panels.push({
      id: 'vocab',
      label: 'Từ vựng',
      icon: Layers,
      node: <VocabSection cards={day.vocabulary} />,
    })
  }
  if (day.reviewOfDay) {
    panels.push({
      id: 'review',
      label: 'Ôn câu sai',
      icon: Sparkles,
      node: (
        <MistakeReview
          reviewOfDay={day.reviewOfDay}
          onSelectDay={onSelectDay}
        />
      ),
    })
  }

  const [active, setActive] = useState(panels[0]?.id ?? '')
  const activePanel = panels.find((p) => p.id === active) ?? panels[0]

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>Tuần {day.week}</span>
          <span className="text-slate-300">•</span>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium',
              meta.pill,
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {meta.label}
          </span>
          {day.duration && (
            <>
              <span className="text-slate-300">•</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {day.duration}
              </span>
            </>
          )}
        </div>

        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-600">
              Ngày {day.day}
            </p>
            <h1 className="mt-0.5 text-2xl font-bold text-slate-900 sm:text-3xl">
              {day.title}
            </h1>
          </div>

          <button
            type="button"
            onClick={() => progress.toggleDone(day.day)}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors',
              isDone
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                : 'bg-brand-600 text-white shadow-card hover:bg-brand-700',
            )}
          >
            {isDone ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Đã hoàn thành
              </>
            ) : (
              <>
                <Circle className="h-4 w-4" />
                Đánh dấu hoàn thành
              </>
            )}
          </button>
        </div>
      </header>

      {/* Section tabs (only when the day has more than one section) */}
      {panels.length > 1 && (
        <div className="mb-5">
          <Tabs
            tabs={panels.map((p) => ({ id: p.id, label: p.label, icon: p.icon }))}
            active={activePanel?.id ?? ''}
            onChange={setActive}
          />
        </div>
      )}

      {/* Body */}
      <div key={activePanel?.id} className="animate-fade-slide-up">
        {activePanel ? (
          activePanel.node
        ) : (
          <EmptyState
            icon={Hourglass}
            title="Nội dung đang được cập nhật"
            description={`Bài học cho Ngày ${day.day} sẽ sớm được bổ sung.`}
          >
            <button
              type="button"
              onClick={() => onSelectDay(1)}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Về Ngày 1
            </button>
          </EmptyState>
        )}
      </div>

      {/* Prev / Next navigation */}
      <nav className="mt-8 flex items-center justify-between border-t border-slate-200 pt-5">
        <button
          type="button"
          disabled={day.day <= 1}
          onClick={() => onSelectDay(day.day - 1)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 enabled:hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Ngày trước
        </button>
        <span className="text-xs text-slate-400">
          {day.day} / {TOTAL_DAYS}
        </span>
        <button
          type="button"
          disabled={day.day >= TOTAL_DAYS}
          onClick={() => onSelectDay(day.day + 1)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 enabled:hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Ngày tiếp theo
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  )
}
