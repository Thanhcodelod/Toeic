import { Check, Languages, RotateCcw, Trophy, X } from 'lucide-react'
import { cn } from '../../../lib/cn'
import type { OptionKey, QuizQuestion } from '../../../data/types'

interface ResultPanelProps {
  questions: QuizQuestion[]
  answers: Record<string, OptionKey>
  correctCount: number
  scorePct: number
  bestScorePct?: number
  onRetry: () => void
}

export function ResultPanel({
  questions,
  answers,
  correctCount,
  scorePct,
  bestScorePct,
  onRetry,
}: ResultPanelProps) {
  const total = questions.length
  const wrongCount = total - correctCount
  const isNewBest = bestScorePct != null && scorePct >= bestScorePct

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {/* Score summary */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="flex flex-col items-center gap-5 bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white sm:flex-row sm:justify-between sm:p-8">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 animate-trophy-in place-items-center rounded-2xl bg-white/15">
              <Trophy className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm text-brand-100">Kết quả bài thi</p>
              <p className="animate-pop text-4xl font-bold tabular-nums">{scorePct}%</p>
              <p className="text-sm text-brand-100">
                Đúng {correctCount}/{total} câu
              </p>
            </div>
          </div>
          <div className="text-center sm:text-right">
            {bestScorePct != null && (
              <p className="text-sm text-brand-100">
                Điểm cao nhất: {bestScorePct}%
              </p>
            )}
            {isNewBest && (
              <span className="mt-1 inline-block rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-900">
                🎉 Kỷ lục mới!
              </span>
            )}
            <button
              type="button"
              onClick={onRetry}
              className="press mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
            >
              <RotateCcw className="h-4 w-4" />
              Làm lại
            </button>
          </div>
        </div>

        <div className="stagger grid grid-cols-3 divide-x divide-slate-200 text-center">
          <div className="p-3">
            <p className="text-xl font-bold text-slate-900">{total}</p>
            <p className="text-xs text-slate-500">Tổng câu</p>
          </div>
          <div className="p-3">
            <p className="text-xl font-bold text-emerald-600">{correctCount}</p>
            <p className="text-xs text-slate-500">Câu đúng</p>
          </div>
          <div className="p-3">
            <p className="text-xl font-bold text-rose-600">{wrongCount}</p>
            <p className="text-xs text-slate-500">Câu sai</p>
          </div>
        </div>
      </div>

      {/* Answer key review */}
      <div>
        <h3 className="mb-3 text-base font-bold text-slate-900">
          Đáp án &amp; giải thích chi tiết
        </h3>
        <div className="space-y-3">
          {questions.map((q, index) => {
            const userAnswer = answers[q.id]
            const isCorrect = userAnswer === q.correct
            return (
              <div
                key={q.id}
                className={cn(
                  'rounded-2xl border bg-white p-5 shadow-card',
                  isCorrect ? 'border-emerald-200' : 'border-rose-200',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[15px] font-medium text-slate-900">
                    <span className="mr-2 font-bold text-slate-400">
                      Câu {index + 1}.
                    </span>
                    {q.question}
                  </p>
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                      isCorrect
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700',
                    )}
                  >
                    {isCorrect ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Đúng
                      </>
                    ) : (
                      <>
                        <X className="h-3.5 w-3.5" /> Sai
                      </>
                    )}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  <p className="text-slate-600">
                    Bạn chọn:{' '}
                    {userAnswer ? (
                      <span
                        className={cn(
                          'font-bold',
                          isCorrect ? 'text-emerald-600' : 'text-rose-600',
                        )}
                      >
                        {userAnswer}. {q.options[userAnswer]}
                      </span>
                    ) : (
                      <span className="font-semibold text-slate-400">
                        Chưa trả lời
                      </span>
                    )}
                  </p>
                  {!isCorrect && (
                    <p className="text-slate-600">
                      Đáp án đúng:{' '}
                      <span className="font-bold text-emerald-600">
                        {q.correct}. {q.options[q.correct]}
                      </span>
                    </p>
                  )}
                </div>

                <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
                  <p className="leading-relaxed text-slate-700">
                    {q.explanation}
                  </p>
                  {q.translation && (
                    <p className="flex items-start gap-2 border-t border-slate-200 pt-2 italic text-slate-500">
                      <Languages className="mt-0.5 h-4 w-4 shrink-0" />
                      {q.translation}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
