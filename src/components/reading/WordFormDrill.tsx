import { useEffect, useState } from 'react'
import { ArrowRight, Check, Loader2, RotateCcw, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import {
  FORM_LABEL,
  answerWordForm,
  getWordFormDrills,
  type WordFormDrill as Drill,
  type WordFormResult,
} from '../../lib/readingApi'

/**
 * Biến đổi từ loại — dạng câu hỏi số 1 của Part 5.
 * Cho từ gốc, người học tự viết ra danh từ / động từ / tính từ / trạng từ.
 * Server chấp nhận MỌI biến thể đúng (production, product, producer, productivity…).
 */
export function WordFormDrill() {
  const [drills, setDrills] = useState<Drill[] | null>(null)
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<WordFormResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setDrills(null)
    setError(null)
    try {
      const d = await getWordFormDrills(10)
      setDrills(d)
      setIdx(0)
      setAnswers({})
      setResult(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const drill = drills?.[idx]
  const filled = drill ? drill.slots.some((s) => (answers[s.form] ?? '').trim()) : false

  const submit = async () => {
    if (!drill || busy || !filled) return
    setBusy(true)
    setError(null)
    try {
      setResult(await answerWordForm(drill.id, answers))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const next = () => {
    if (!drills) return
    if (idx + 1 >= drills.length) {
      void load()
      return
    }
    setIdx(idx + 1)
    setAnswers({})
    setResult(null)
  }

  if (error && !drills) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="text-sm font-semibold text-rose-800">{error}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="press mt-3 inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white"
        >
          <RotateCcw className="h-4 w-4" /> Thử lại
        </button>
      </div>
    )
  }
  if (!drills) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" /> Đang tải từ…
      </div>
    )
  }
  if (!drill) {
    return (
      <p className="py-16 text-center text-sm text-slate-500">
        Chưa có từ nào. Nội dung sẽ sớm được bổ sung.
      </p>
    )
  }

  const resOf = (form: string) => result?.slots.find((s) => s.form === form)

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-600">
          Từ {idx + 1}/{drills.length}
        </span>
        <span className="text-xs text-slate-400">
          Bỏ trống ô nào nếu bạn không chắc — vẫn được chấm
        </span>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Từ gốc
          </p>
          <h3 className="mt-1 text-4xl font-bold text-slate-900">{drill.root}</h3>
          <p className="mt-1 text-sm text-violet-700">{drill.meaning}</p>
        </div>

        <div className="mt-6 space-y-3">
          {drill.slots.map((s) => {
            const r = resOf(s.form)
            return (
              <div key={s.form}>
                <label className="flex items-center justify-between text-sm font-semibold text-slate-700">
                  <span>{FORM_LABEL[s.form]}</span>
                  {s.hint && (
                    <span className="text-xs font-normal text-slate-400">{s.hint}</span>
                  )}
                </label>
                <div className={cn('relative mt-1', r && !r.ok && 'animate-shake')}>
                  <input
                    type="text"
                    value={answers[s.form] ?? ''}
                    disabled={!!result}
                    onChange={(e) =>
                      setAnswers((p) => ({ ...p, [s.form]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') result ? next() : void submit()
                    }}
                    placeholder={`${FORM_LABEL[s.form].toLowerCase()} của "${drill.root}"…`}
                    className={cn(
                      'w-full rounded-xl border px-4 py-2.5 outline-none transition-colors',
                      r
                        ? r.ok
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                          : 'border-rose-400 bg-rose-50 text-rose-800'
                        : 'border-slate-200 focus:border-violet-500',
                    )}
                  />
                  {r && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      {r.ok ? (
                        <Check className="h-5 w-5 animate-pop text-emerald-600" />
                      ) : (
                        <X className="h-5 w-5 animate-pop text-rose-600" />
                      )}
                    </span>
                  )}
                </div>

                {r && (
                  <div className="animate-fade-slide-down mt-1.5 rounded-lg bg-slate-50 px-3 py-2 text-xs">
                    <p className="text-slate-700">
                      <span className="font-semibold">Chấp nhận:</span>{' '}
                      {r.answers.map((a, i) => (
                        <span key={a}>
                          {i > 0 && ' · '}
                          <span className="font-bold text-emerald-700">{a}</span>
                        </span>
                      ))}
                    </p>
                    {r.example && (
                      <p className="mt-0.5 italic text-slate-500">“{r.example}”</p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {result && (
          <div
            className={cn(
              'animate-pop-in mt-5 rounded-xl p-4 text-center',
              result.pct >= 80 ? 'bg-emerald-50' : 'bg-amber-50',
            )}
          >
            <p className="text-sm font-bold text-slate-800">
              Đúng {result.correct}/{result.total} dạng ·{' '}
              <span className={result.pct >= 80 ? 'text-emerald-700' : 'text-amber-700'}>
                {result.pct}%
              </span>
            </p>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

        <button
          type="button"
          onClick={result ? next : () => void submit()}
          disabled={!result && (!filled || busy)}
          className="press mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white shadow-card hover:bg-violet-700 disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {result ? (
            <>
              Từ tiếp theo <ArrowRight className="h-4 w-4" />
            </>
          ) : (
            'Chấm bài — Enter'
          )}
        </button>
      </div>
    </div>
  )
}
