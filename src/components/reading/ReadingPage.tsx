import { useCallback, useEffect, useState } from 'react'
import {
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  Languages,
  Loader2,
  RefreshCw,
  Scissors,
  Shapes,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { UserMenu } from '../../auth/UserMenu'
import {
  getReadingLessons,
  getReadingStats,
  type ReadingKind,
  type ReadingLesson,
  type ReadingStats,
} from '../../lib/readingApi'
import { ParseDrill } from './ParseDrill'
import { WordFormDrill } from './WordFormDrill'
import { ReverseDrill } from './ReverseDrill'

interface Props {
  onBack: () => void
}

const TABS: {
  id: ReadingKind
  label: string
  icon: typeof Scissors
  desc: string
}[] = [
  {
    id: 'parse',
    label: 'Phân tích câu',
    icon: Scissors,
    desc: 'Tách S · V · O ra khỏi mệnh đề quan hệ và cụm giới từ — làm Part 5 mà không cần dịch.',
  },
  {
    id: 'wordform',
    label: 'Biến đổi từ loại',
    icon: Shapes,
    desc: 'produce → production / productive / productively. Dạng câu hỏi số 1 của Part 5.',
  },
  {
    id: 'reverse',
    label: 'Dịch ngược',
    icon: Languages,
    desc: 'Dịch câu Anh sang Việt, rồi giấu câu Anh đi và viết lại — kiểm tra cấu trúc gốc có về không.',
  },
]

export function ReadingPage({ onBack }: Props) {
  const [tab, setTabState] = useState<ReadingKind>('parse')
  const [lesson, setLesson] = useState<number | null>(null)
  const [stats, setStats] = useState<ReadingStats | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setStats(await getReadingStats())
    } catch {
      /* thống kê hỏng thì vẫn cho làm bài */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // Đổi dạng bài -> về màn chọn bài của dạng đó.
  const setTab = (id: ReadingKind) => {
    setTabState(id)
    setLesson(null)
  }

  const active = TABS.find((t) => t.id === tab)!
  const s = stats?.[tab]

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
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-card">
              <BookOpenCheck className="h-5 w-5" />
            </div>
            <h1 className="text-sm font-bold text-slate-900 sm:text-base">
              Ôn Reading — Part 5 &amp; 6
            </h1>
          </div>
          <div className="ml-auto">
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="thin-scrollbar flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto mb-5 max-w-3xl">
          {/* Ba dạng bài */}
          <div className="stagger grid gap-2 sm:grid-cols-3">
            {TABS.map((t) => {
              const Icon = t.icon
              const st = stats?.[t.id]
              const on = t.id === tab
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'lift press flex flex-col items-start gap-1 rounded-2xl border p-4 text-left',
                    on
                      ? 'border-sky-400 bg-white shadow-card-lg ring-1 ring-sky-200'
                      : 'border-slate-200 bg-white/60 hover:border-sky-200 hover:bg-white',
                  )}
                >
                  <span
                    className={cn(
                      'grid h-9 w-9 place-items-center rounded-xl',
                      on ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-bold text-slate-900">{t.label}</span>
                  {st && (
                    <span className="text-xs text-slate-500">
                      Đã đạt{' '}
                      <span className="font-bold text-emerald-600">{st.mastered}</span>
                      /{st.total} · đã làm {st.attempted}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Mô tả dạng bài đang chọn */}
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="flex-1 text-sm text-slate-600">{active.desc}</p>
            <button
              type="button"
              onClick={() => void refresh()}
              className="press inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Làm mới
            </button>
          </div>

          {s && s.total === 0 && (
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-700">
              Chưa có nội dung cho dạng bài này.
            </p>
          )}
        </div>

        {/* Chọn bài -> làm bài. Key theo (tab + lesson) để mỗi lần đổi màn trượt vào một lần. */}
        <div key={`${tab}:${lesson ?? 'list'}`} className="animate-fade-slide-up">
          {lesson === null ? (
            <LessonPicker kind={tab} onPick={setLesson} />
          ) : (
            <div className="mx-auto max-w-3xl">
              <button
                type="button"
                onClick={() => {
                  setLesson(null)
                  void refresh()
                }}
                className="press mb-3 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                <ArrowLeft className="h-4 w-4" /> Danh sách bài · {active.label} — Bài {lesson}
              </button>

              {tab === 'parse' && (
                <ParseDrill lesson={lesson} onDone={() => { setLesson(null); void refresh() }} />
              )}
              {tab === 'wordform' && (
                <WordFormDrill lesson={lesson} onDone={() => { setLesson(null); void refresh() }} />
              )}
              {tab === 'reverse' && (
                <ReverseDrill lesson={lesson} onDone={() => { setLesson(null); void refresh() }} />
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

/** Lưới các BÀI (~12 câu) của một dạng, kèm tiến độ từng bài. */
function LessonPicker({
  kind,
  onPick,
}: {
  kind: ReadingKind
  onPick: (lesson: number) => void
}) {
  const [lessons, setLessons] = useState<ReadingLesson[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false
    setLessons(null)
    setError(null)
    getReadingLessons(kind)
      .then((l) => !ignore && setLessons(l))
      .catch((e) => !ignore && setError((e as Error).message))
    return () => {
      ignore = true
    }
  }, [kind])

  if (error) {
    return (
      <p className="mx-auto max-w-lg rounded-xl border border-rose-200 bg-rose-50 p-4 text-center text-sm text-rose-700">
        {error}
      </p>
    )
  }
  if (!lessons) {
    return (
      <div className="mx-auto grid max-w-3xl gap-2 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-20 w-full rounded-2xl" />
        ))}
        <span className="sr-only">Đang tải danh sách bài…</span>
      </div>
    )
  }
  if (lessons.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-slate-500">
        Chưa có bài nào. Nội dung sẽ sớm được bổ sung.
      </p>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="mb-3 text-center text-sm text-slate-500">
        Chọn một bài để luyện. Mỗi bài khoảng 12 câu.
      </p>
      <div className="stagger grid gap-2 sm:grid-cols-2">
        {lessons.map((l) => {
          const complete = l.mastered >= l.total
          const pct = l.total ? Math.round((l.mastered / l.total) * 100) : 0
          return (
            <button
              key={l.lesson}
              type="button"
              onClick={() => onPick(l.lesson)}
              className={cn(
                'lift press flex items-center gap-3 rounded-2xl border p-4 text-left',
                complete
                  ? 'border-emerald-300 bg-emerald-50/60'
                  : 'border-slate-200 bg-white hover:border-sky-300',
              )}
            >
              <span
                className={cn(
                  'grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-bold',
                  complete ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-100 text-sky-700',
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
                        : 'bg-gradient-to-r from-sky-400 to-sky-600',
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Đạt{' '}
                  <span className="font-semibold text-emerald-600">{l.mastered}</span>/
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
