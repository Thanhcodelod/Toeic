import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, CheckCircle2, Headphones, Loader2 } from 'lucide-react'
import { cn } from '../../lib/cn'
import { UserMenu } from '../../auth/UserMenu'
import { DictationExercise } from './DictationExercise'
import {
  getCompletedItemIds,
  getDictationItems,
  getDictationLines,
  getDictationStats,
  getDictationTests,
  type DictationItem,
  type DictationLine,
  type DictationTest,
} from '../../lib/dictationApi'

const PART_TABS = [
  { p: 1, label: 'Part 1', hint: 'Mô tả tranh' },
  { p: 2, label: 'Part 2', hint: 'Hỏi–đáp' },
  { p: 3, label: 'Part 3', hint: 'Hội thoại' },
  { p: 4, label: 'Part 4', hint: 'Bài nói' },
]

export function DictationPage({ onBack }: { onBack: () => void }) {
  const [tests, setTests] = useState<DictationTest[]>([])
  const [stats, setStats] = useState<Record<number, { done: number; total: number }>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [test, setTest] = useState<DictationTest | null>(null)
  const [items, setItems] = useState<DictationItem[]>([])
  const [doneIds, setDoneIds] = useState<Set<number>>(new Set())
  const [part, setPart] = useState(1)

  const [item, setItem] = useState<DictationItem | null>(null)
  const [lines, setLines] = useState<DictationLine[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let ignore = false
    getDictationTests()
      .then(async (ts) => {
        if (ignore) return
        setTests(ts)
        const entries = await Promise.all(
          ts.map(async (t) => {
            try {
              const s = await getDictationStats(t.id)
              return [t.id, { done: s.doneItems, total: s.totalItems }] as const
            } catch {
              return [t.id, { done: 0, total: 0 }] as const
            }
          }),
        )
        if (!ignore) setStats(Object.fromEntries(entries))
      })
      .catch((e: unknown) => !ignore && setError((e as Error)?.message ?? 'Lỗi tải dữ liệu'))
      .finally(() => !ignore && setLoading(false))
    return () => { ignore = true }
  }, [])

  const openTest = async (t: DictationTest) => {
    setBusy(true)
    try {
      const [its, done] = await Promise.all([getDictationItems(t.id), getCompletedItemIds()])
      setItems(its)
      setDoneIds(done)
      setTest(t)
      setPart(1)
    } catch (e) {
      setError((e as Error)?.message ?? 'Lỗi tải danh sách câu')
    } finally {
      setBusy(false)
    }
  }

  const openItem = async (it: DictationItem) => {
    setBusy(true)
    try {
      setLines(await getDictationLines(it.id))
      setItem(it)
    } catch (e) {
      setError((e as Error)?.message ?? 'Lỗi tải nội dung')
    } finally {
      setBusy(false)
    }
  }

  const refreshDone = useCallback(async () => {
    try {
      setDoneIds(await getCompletedItemIds())
      if (test) {
        const s = await getDictationStats(test.id)
        setStats((p) => ({ ...p, [test.id]: { done: s.doneItems, total: s.totalItems } }))
      }
    } catch { /* ignore */ }
  }, [test])

  const header = (
    <header className="z-20 shrink-0 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
        <button type="button" onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
          <ArrowLeft className="h-4 w-4" /> Lộ trình 90 ngày
        </button>
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-card">
            <Headphones className="h-5 w-5" />
          </div>
          <h1 className="text-sm font-bold text-slate-900 sm:text-base">Nghe chép chính tả</h1>
        </div>
        <div className="ml-auto"><UserMenu /></div>
      </div>
    </header>
  )

  const body = () => {
    if (loading) return <div className="flex items-center justify-center gap-2 py-24 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /> Đang tải…</div>
    if (error) return <p className="mx-auto max-w-lg rounded-xl border border-rose-200 bg-rose-50 p-4 text-center text-sm text-rose-700">{error}</p>

    // 3) exercise
    if (test && item) {
      return (
        <DictationExercise
          testTitle={test.title}
          item={item}
          lines={lines}
          onBack={() => { setItem(null); void refreshDone() }}
          onCompleted={refreshDone}
        />
      )
    }

    // 2) item list
    if (test) {
      const list = items.filter((i) => i.part === part)
      return (
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => setTest(null)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
              <ArrowLeft className="h-4 w-4" /> Chọn đề khác
            </button>
            <h2 className="text-base font-bold text-slate-900">{test.title}</h2>
          </div>

          <div className="inline-flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
            {PART_TABS.map((t) => (
              <button key={t.p} type="button" onClick={() => setPart(t.p)}
                className={cn('rounded-lg px-3 py-2 text-sm font-medium transition-all',
                  part === t.p ? 'bg-white text-sky-700 shadow-card' : 'text-slate-500 hover:text-slate-700')}>
                {t.label} <span className="hidden text-xs text-slate-400 sm:inline">· {t.hint}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {list.map((it) => {
              const done = doneIds.has(it.id)
              const label = it.qTo !== it.qFrom ? `${it.qFrom}–${it.qTo}` : `${it.qFrom}`
              return (
                <button key={it.id} type="button" onClick={() => void openItem(it)} disabled={busy}
                  className={cn(
                    'flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-all',
                    done ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50',
                  )}>
                  <span>Câu {label}</span>
                  {done && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                </button>
              )
            })}
          </div>
          {busy && <p className="flex items-center justify-center gap-2 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải…</p>}
        </div>
      )
    }

    // 1) test list
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <p className="text-center text-sm text-slate-500">
          Nghe từng câu/đoạn của đề ETS 2023 và chép lại. Chọn mức độ để tăng số từ phải điền.
        </p>
        <div className="grid gap-3">
          {tests.map((t) => {
            const s = stats[t.id] ?? { done: 0, total: 0 }
            const pct = s.total ? Math.round((s.done / s.total) * 100) : 0
            return (
              <button key={t.id} type="button" onClick={() => void openTest(t)} disabled={busy}
                className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-card transition-all hover:border-sky-300 hover:shadow-card-lg">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-slate-900">{t.title}</span>
                  <span className="text-sm font-semibold text-sky-700">{s.done}/{s.total} câu</span>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-600 transition-[width] duration-500" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-2 text-xs text-slate-500">54 đoạn · Part 1–4 · đủ 100 câu</p>
              </button>
            )
          })}
        </div>
        {busy && <p className="flex items-center justify-center gap-2 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải…</p>}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {header}
      <main className="thin-scrollbar flex-1 overflow-y-auto px-4 py-6">{body()}</main>
    </div>
  )
}
