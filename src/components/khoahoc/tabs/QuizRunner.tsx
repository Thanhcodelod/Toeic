import { useState } from 'react'
import { Check, Loader2, RotateCcw, X } from 'lucide-react'
import { cn } from '../../../lib/cn'
import { submitCourseTest, type Mcq, type TestResult } from '../../../lib/courseApi'

const LETTERS = ['A', 'B', 'C', 'D'] as const

interface Props {
  lessonKey: string
  tab: 'quiz' | 'test'
  items: Mcq[]
  onGraded?: () => void
}

export function QuizRunner({ lessonKey, tab, items, onGraded }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<TestResult | null>(null)
  const [busy, setBusy] = useState(false)

  const allAnswered = items.every((it) => answers[String(it.ord)])

  const submit = async () => {
    if (!allAnswered || busy) return
    setBusy(true)
    try {
      const r = await submitCourseTest(lessonKey, tab, answers)
      setResult(r)
      onGraded?.()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      /* bỏ qua */
    } finally {
      setBusy(false)
    }
  }
  const reset = () => {
    setAnswers({})
    setResult(null)
  }

  const scoreColor = result && result.score >= 70 ? 'text-emerald-600' : result && result.score >= 50 ? 'text-amber-600' : 'text-rose-600'

  return (
    <div className="space-y-4">
      {result && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-card">
          <p className={cn('text-4xl font-bold tabular-nums', scoreColor)}>
            {result.score}
            <span className="text-lg text-slate-400">/100</span>
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Đúng {result.correctCount}/{result.total} câu
            {tab === 'quiz' && result.score >= 70 && ' · đạt yêu cầu, bài học được đánh dấu hoàn thành 🎉'}
          </p>
          <button
            type="button"
            onClick={reset}
            className="press mt-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4" /> Làm lại
          </button>
        </div>
      )}

      {items.map((item, qi) => {
        const rv = result?.review.find((r) => r.ord === item.ord)
        const chosen = answers[String(item.ord)]
        return (
          <div key={item.ord} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <p className="text-sm font-semibold leading-relaxed text-slate-900">
              <span className="text-slate-400">Câu {qi + 1}. </span>
              {item.stem}
            </p>
            <div className="mt-3 space-y-2">
              {LETTERS.map((L) => {
                const text = item.options[L]
                if (!text) return null
                const isChosen = chosen === L
                const isCorrect = rv?.correct === L
                return (
                  <button
                    key={L}
                    type="button"
                    disabled={!!result}
                    onClick={() => setAnswers((a) => ({ ...a, [String(item.ord)]: L }))}
                    className={cn(
                      'flex w-full items-start gap-2.5 rounded-xl border p-3 text-left text-sm transition',
                      !result && isChosen && 'border-violet-400 bg-violet-50',
                      !result && !isChosen && 'press border-slate-200 hover:border-violet-300',
                      result && isCorrect && 'border-emerald-400 bg-emerald-50',
                      result && isChosen && !isCorrect && 'border-rose-400 bg-rose-50',
                      result && !isCorrect && !isChosen && 'border-slate-200 opacity-60',
                    )}
                  >
                    <span
                      className={cn(
                        'grid h-6 w-6 shrink-0 place-items-center rounded-md text-xs font-bold',
                        result && isCorrect
                          ? 'bg-emerald-500 text-white'
                          : result && isChosen
                            ? 'bg-rose-500 text-white'
                            : isChosen
                              ? 'bg-violet-500 text-white'
                              : 'bg-slate-100 text-slate-600',
                      )}
                    >
                      {result && isCorrect ? <Check className="h-3.5 w-3.5" /> : result && isChosen ? <X className="h-3.5 w-3.5" /> : L}
                    </span>
                    <span className="flex-1 text-slate-800">{text}</span>
                  </button>
                )
              })}
            </div>
            {rv && (
              <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
                <span className={cn('font-bold', rv.ok ? 'text-emerald-600' : 'text-rose-600')}>
                  {rv.ok ? 'Chính xác! ' : `Đáp án đúng: ${rv.correct}. `}
                </span>
                {rv.explanation}
              </p>
            )}
          </div>
        )
      })}

      {!result && (
        <button
          type="button"
          onClick={() => void submit()}
          disabled={!allAnswered || busy}
          className="press inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white shadow-card hover:bg-violet-700 disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {allAnswered ? 'Nộp bài' : `Còn ${items.filter((it) => !answers[String(it.ord)]).length} câu chưa trả lời`}
        </button>
      )}
    </div>
  )
}
