import { useEffect, useMemo, useRef, useState } from 'react'
import { Award, RotateCcw } from 'lucide-react'
import { QuizCard } from './QuizCard'
import type { OptionKey, QuizQuestion } from '../../../data/types'

interface QuizTabProps {
  dayNumber: number
  quiz: QuizQuestion[]
  /** Answers already saved to the account (restored on login / other devices). */
  savedAnswers?: Record<string, OptionKey>
  /** Records the completed quiz (score + answers) to the account. */
  onComplete: (scorePct: number, answers: Record<string, OptionKey>) => void
}

function readDraft(key: string): Record<string, OptionKey> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as Record<string, OptionKey>) : {}
  } catch {
    return {}
  }
}

export function QuizTab({
  dayNumber,
  quiz,
  savedAnswers,
  onComplete,
}: QuizTabProps) {
  const draftKey = `toeic90:grammar:${dayNumber}:answers`

  // Seed from the on-device draft first (instant), else the account's saved answers.
  const [answers, setAnswers] = useState<Record<string, OptionKey>>(() => {
    const draft = readDraft(draftKey)
    return Object.keys(draft).length ? draft : (savedAnswers ?? {})
  })

  // Seed from account answers when they arrive (async) and nothing is entered yet.
  const seededRef = useRef(false)
  useEffect(() => {
    if (seededRef.current) return
    if (
      savedAnswers &&
      Object.keys(savedAnswers).length > 0 &&
      Object.keys(answers).length === 0
    ) {
      seededRef.current = true
      setAnswers(savedAnswers)
    }
  }, [savedAnswers, answers])

  // Persist the draft on this device (survives reload / logout).
  useEffect(() => {
    try {
      window.localStorage.setItem(draftKey, JSON.stringify(answers))
    } catch {
      /* ignore quota / private mode */
    }
  }, [draftKey, answers])

  const answeredCount = Object.keys(answers).length
  const correctCount = useMemo(
    () =>
      quiz.reduce((sum, q) => (answers[q.id] === q.correct ? sum + 1 : sum), 0),
    [answers, quiz],
  )
  const allAnswered = answeredCount === quiz.length

  const handleSelect = (id: string, key: OptionKey) => {
    seededRef.current = true // user is answering — don't re-seed over their input
    setAnswers((prev) => ({ ...prev, [id]: key }))
  }

  const reset = () => {
    seededRef.current = true
    setAnswers({})
  }

  const scorePct =
    quiz.length > 0 ? Math.round((correctCount / quiz.length) * 100) : 0

  return (
    <div className="space-y-4">
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
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <RotateCcw className="h-4 w-4" />
            Làm lại
          </button>
        )}
      </div>

      {/* Questions */}
      {quiz.map((question, index) => (
        <QuizCard
          key={question.id}
          question={question}
          index={index}
          selected={answers[question.id]}
          onSelect={(key) => handleSelect(question.id, key)}
        />
      ))}

      {/* Completion banner */}
      {allAnswered && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 text-center animate-fade-slide-up sm:flex-row sm:justify-between sm:text-left">
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
            onClick={() => onComplete(scorePct, answers)}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-card hover:bg-emerald-700"
          >
            Đánh dấu hoàn thành ngày này
          </button>
        </div>
      )}
    </div>
  )
}
