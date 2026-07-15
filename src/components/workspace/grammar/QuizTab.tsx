import { useEffect, useMemo, useState } from 'react'
import { Award, Loader2, RotateCcw } from 'lucide-react'
import { QuizCard } from './QuizCard'
import { clearDayAnswers, getDayAnswers, saveAnswer } from '../../../lib/answersApi'
import type { OptionKey, QuizQuestion } from '../../../data/types'

interface QuizTabProps {
  dayNumber: number
  quiz: QuizQuestion[]
  /** Records the completed quiz score on the account. */
  onComplete: (scorePct: number) => void
}

export function QuizTab({ dayNumber, quiz, onComplete }: QuizTabProps) {
  // answers are keyed by question id for the UI; persisted by question `ord`.
  const [answers, setAnswers] = useState<Record<string, OptionKey>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const byOrd = useMemo(() => {
    const m = new Map<number, QuizQuestion>()
    for (const q of quiz) m.set(q.ord, q)
    return m
  }, [quiz])

  // Load every previously-saved answer for this day from the database.
  useEffect(() => {
    let ignore = false
    setLoading(true)
    getDayAnswers(dayNumber, 'grammar')
      .then((rows) => {
        if (ignore) return
        const next: Record<string, OptionKey> = {}
        for (const [ordStr, chosen] of Object.entries(rows)) {
          const q = byOrd.get(Number(ordStr))
          if (q) next[q.id] = chosen
        }
        setAnswers(next)
        setLoading(false)
      })
      .catch((e: unknown) => {
        if (ignore) return
        setError((e as Error)?.message ?? 'Lỗi tải đáp án đã lưu')
        setLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [dayNumber, byOrd])

  const answeredCount = Object.keys(answers).length
  const correctCount = useMemo(
    () => quiz.reduce((sum, q) => (answers[q.id] === q.correct ? sum + 1 : sum), 0),
    [answers, quiz],
  )
  const allAnswered = answeredCount === quiz.length
  const scorePct = quiz.length > 0 ? Math.round((correctCount / quiz.length) * 100) : 0

  const handleSelect = (q: QuizQuestion, key: OptionKey) => {
    setAnswers((prev) => ({ ...prev, [q.id]: key }))
    // persist this single answer immediately (server grades it)
    saveAnswer(dayNumber, 'grammar', q.ord, key).catch((e) =>
      console.warn('Lưu đáp án thất bại', e),
    )
  }

  const reset = () => {
    setAnswers({})
    clearDayAnswers(dayNumber, 'grammar').catch((e) =>
      console.warn('Xoá đáp án thất bại', e),
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" /> Đang tải đáp án đã lưu…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
          {error}
        </p>
      )}

      {/* Progress summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <div className="text-sm text-slate-600">
          Đã trả lời{' '}
          <span className="font-semibold text-slate-900">
            {answeredCount}/{quiz.length}
          </span>{' '}
          câu · Số câu đúng:{' '}
          <span className="font-semibold text-emerald-600">{correctCount}</span>
        </div>
        {answeredCount > 0 && (
          <button
            type="button"
            onClick={reset}
            className="press inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <RotateCcw className="h-4 w-4" />
            Làm lại
          </button>
        )}
      </div>

      {/* Questions — hiện ra so le lúc tải xong. Mỗi thẻ có key ổn định
          (question.id) nên hiệu ứng vào chỉ chạy một lần, không lặp lại
          mỗi khi người dùng chọn đáp án. */}
      <div className="stagger space-y-4">
        {quiz.map((question, index) => (
          <QuizCard
            key={question.id}
            question={question}
            index={index}
            selected={answers[question.id]}
            onSelect={(key) => handleSelect(question, key)}
          />
        ))}
      </div>

      {/* Completion banner */}
      {allAnswered && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 text-center animate-pop-in sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-600">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">
                Hoàn thành bài luyện tập!
              </p>
              <p className="text-sm text-slate-600">
                Bạn trả lời đúng {correctCount}/{quiz.length} câu ({scorePct}%).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onComplete(scorePct)}
            className="press rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-card hover:bg-emerald-700"
          >
            Đánh dấu hoàn thành ngày này
          </button>
        </div>
      )}
    </div>
  )
}
