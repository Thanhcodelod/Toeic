import { useCallback, useEffect, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Headphones,
  ListChecks,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { UserMenu } from '../../auth/UserMenu'
import {
  PARTS,
  PART_META,
  getPtLessons,
  getPtStats,
  type Part,
  type PtLesson,
  type PtStats,
} from '../../lib/practiceApi'
import { PartRunner } from './PartRunner'

interface Props {
  onBack: () => void
}

export function PracticePartsPage({ onBack }: Props) {
  const [part, setPartState] = useState<Part>(1)
  const [lesson, setLesson] = useState<number | null>(null)
  const [stats, setStats] = useState<PtStats | null>(null)

  const refresh = useCallback(async () => {
    try {
      setStats(await getPtStats())
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const setPart = (p: Part) => {
    setPartState(p)
    setLesson(null)
  }

  const meta = PART_META[part]

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="z-20 shrink-0 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
          <button
            type="button"
            onClick={onBack}
            className="press inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Lộ trình 90 ngày
          </button>
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-card">
              <ListChecks className="h-5 w-5" />
            </div>
            <h1 className="text-sm font-bold text-slate-900 sm:text-base">
              Ôn tập Part 1–7
            </h1>
          </div>
          <div className="ml-auto">
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="thin-scrollbar flex-1 overflow-y-auto px-4 py-6">
        {/* 7 part */}
        <div className="mx-auto mb-5 max-w-3xl">
          <div className="stagger grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {PARTS.map((p) => {
              const m = PART_META[p]
              const st = stats?.[String(p)]
              const on = p === part
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPart(p)}
                  className={cn(
                    'lift press flex flex-col items-center gap-1 rounded-2xl border p-3 text-center',
                    on
                      ? 'border-indigo-400 bg-white shadow-card-lg ring-1 ring-indigo-200'
                      : 'border-slate-200 bg-white/60 hover:border-indigo-200 hover:bg-white',
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
                      m.skill === 'Nghe'
                        ? 'bg-sky-100 text-sky-700'
                        : 'bg-amber-100 text-amber-700',
                    )}
                  >
                    {m.skill === 'Nghe' && <Headphones className="h-2.5 w-2.5" />}
                    {m.skill}
                  </span>
                  <span className="text-sm font-bold text-slate-900">Part {p}</span>
                  {st && (
                    <span className="text-[11px] text-slate-500">
                      {st.correct}/{st.total}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          <p className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-sm text-slate-600">
            {meta.label} — {meta.hint}
          </p>
        </div>

        <div key={`${part}:${lesson ?? 'list'}`} className="animate-fade-slide-up">
          {lesson === null ? (
            <LessonPicker part={part} onPick={setLesson} />
          ) : (
            <div className="mx-auto max-w-2xl">
              <button
                type="button"
                onClick={() => {
                  setLesson(null)
                  void refresh()
                }}
                className="press mb-3 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                <ArrowLeft className="h-4 w-4" /> Danh sách bài · Part {part} — Bài {lesson}
              </button>
              <PartRunner
                part={part}
                lesson={lesson}
                onDone={() => {
                  setLesson(null)
                  void refresh()
                }}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function LessonPicker({ part, onPick }: { part: Part; onPick: (l: number) => void }) {
  const [lessons, setLessons] = useState<PtLesson[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false
    setLessons(null)
    setError(null)
    getPtLessons(part)
      .then((l) => !ignore && setLessons(l))
      .catch((e) => !ignore && setError((e as Error).message))
    return () => {
      ignore = true
    }
  }, [part])

  if (error)
    return (
      <p className="mx-auto max-w-lg rounded-xl border border-rose-200 bg-rose-50 p-4 text-center text-sm text-rose-700">
        {error}
      </p>
    )
  if (!lessons)
    return (
      <div className="mx-auto grid max-w-3xl gap-2 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-20 w-full rounded-2xl" />
        ))}
      </div>
    )
  if (lessons.length === 0)
    return (
      <p className="py-16 text-center text-sm text-slate-500">
        Chưa có bài nào cho part này. Nội dung sẽ sớm được bổ sung.
      </p>
    )

  return (
    <div className="mx-auto max-w-3xl">
      <p className="mb-3 text-center text-sm text-slate-500">Chọn một bài để luyện.</p>
      <div className="stagger grid gap-2 sm:grid-cols-2">
        {lessons.map((l) => {
          const complete = l.correct >= l.total
          const pct = l.total ? Math.round((l.correct / l.total) * 100) : 0
          return (
            <button
              key={l.lesson}
              type="button"
              onClick={() => onPick(l.lesson)}
              className={cn(
                'lift press flex items-center gap-3 rounded-2xl border p-4 text-left',
                complete
                  ? 'border-emerald-300 bg-emerald-50/60'
                  : 'border-slate-200 bg-white hover:border-indigo-300',
              )}
            >
              <span
                className={cn(
                  'grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-bold',
                  complete
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-indigo-100 text-indigo-700',
                )}
              >
                {complete ? <CheckCircle2 className="h-6 w-6 animate-pop" /> : l.lesson}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900">
                  Bài {l.lesson}{' '}
                  <span className="font-normal text-slate-400">
                    · câu {l.fromNo}–{l.toNo}
                  </span>
                </p>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={cn(
                      'bar-fill h-full rounded-full',
                      complete
                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                        : 'bg-gradient-to-r from-indigo-400 to-indigo-600',
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Đúng <span className="font-semibold text-emerald-600">{l.correct}</span>/
                  {l.total} · đã làm {l.attempted}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
