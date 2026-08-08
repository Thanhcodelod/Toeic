import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { cn } from '../../../lib/cn'
import { answerCourseItem, type AnswerResult, type Mcq } from '../../../lib/courseApi'

const LETTERS = ['A', 'B', 'C', 'D'] as const

export function ExerciseTab({ lessonKey, items }: { lessonKey: string; items: Mcq[] }) {
  const [state, setState] = useState<Record<number, { chosen: string; res: AnswerResult }>>({})

  const choose = async (item: Mcq, opt: string) => {
    if (state[item.ord]) return
    let res: AnswerResult
    try {
      res = await answerCourseItem(lessonKey, 'exercises', item.ord, opt)
    } catch {
      return
    }
    setState((s) => ({ ...s, [item.ord]: { chosen: opt, res } }))
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Chọn đáp án để xem phản hồi ngay.</p>
      {items.map((item, qi) => {
        const answered = state[item.ord]
        const show = !!answered
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
                const isChosen = answered?.chosen === L
                const isCorrect = answered?.res.correctOption === L
                return (
                  <button
                    key={L}
                    type="button"
                    disabled={show}
                    onClick={() => void choose(item, L)}
                    className={cn(
                      'flex w-full items-start gap-2.5 rounded-xl border p-3 text-left text-sm transition',
                      !show && 'press border-slate-200 hover:border-violet-300',
                      show && isCorrect && 'border-emerald-400 bg-emerald-50',
                      show && isChosen && !isCorrect && 'border-rose-400 bg-rose-50',
                      show && !isCorrect && !isChosen && 'border-slate-200 opacity-60',
                    )}
                  >
                    <span
                      className={cn(
                        'grid h-6 w-6 shrink-0 place-items-center rounded-md text-xs font-bold',
                        show && isCorrect
                          ? 'bg-emerald-500 text-white'
                          : show && isChosen
                            ? 'bg-rose-500 text-white'
                            : 'bg-slate-100 text-slate-600',
                      )}
                    >
                      {show && isCorrect ? <Check className="h-3.5 w-3.5" /> : show && isChosen ? <X className="h-3.5 w-3.5" /> : L}
                    </span>
                    <span className="flex-1 text-slate-800">{text}</span>
                  </button>
                )
              })}
            </div>
            {answered && (
              <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
                <span className={cn('font-bold', answered.res.correct ? 'text-emerald-600' : 'text-rose-600')}>
                  {answered.res.correct ? 'Chính xác! ' : `Đáp án đúng: ${answered.res.correctOption}. `}
                </span>
                {answered.res.explanation}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
