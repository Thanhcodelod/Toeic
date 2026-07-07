import { useState } from 'react'
import { Check, ChevronDown, Languages, X } from 'lucide-react'
import { cn } from '../../../lib/cn'
import type { OptionKey, QuizQuestion } from '../../../data/types'

const OPTION_KEYS: OptionKey[] = ['A', 'B', 'C', 'D']

interface QuizCardProps {
  question: QuizQuestion
  index: number
  selected?: OptionKey
  onSelect: (key: OptionKey) => void
}

export function QuizCard({ question, index, selected, onSelect }: QuizCardProps) {
  const answered = selected != null
  const isCorrect = answered && selected === question.correct
  const [showExplanation, setShowExplanation] = useState(false)

  const handleSelect = (key: OptionKey) => {
    if (answered) return // locked after first answer
    onSelect(key)
    setShowExplanation(true)
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-100 text-sm font-bold text-brand-700">
          {index + 1}
        </span>
        <p className="pt-0.5 text-[15px] font-medium leading-relaxed text-slate-900">
          {question.question}
        </p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {OPTION_KEYS.map((key) => {
          const optionIsCorrect = key === question.correct
          const optionIsSelected = key === selected
          const showAsCorrect = answered && optionIsCorrect
          const showAsWrong = answered && optionIsSelected && !optionIsCorrect

          return (
            <button
              key={key}
              type="button"
              disabled={answered}
              onClick={() => handleSelect(key)}
              className={cn(
                'flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all',
                !answered &&
                  'border-slate-200 hover:border-brand-300 hover:bg-brand-50',
                showAsCorrect && 'border-emerald-400 bg-emerald-50',
                showAsWrong && 'border-rose-400 bg-rose-50',
                answered &&
                  !showAsCorrect &&
                  !showAsWrong &&
                  'border-slate-200 opacity-60',
              )}
            >
              <span
                className={cn(
                  'grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-bold',
                  showAsCorrect && 'border-emerald-500 bg-emerald-500 text-white',
                  showAsWrong && 'border-rose-500 bg-rose-500 text-white',
                  !showAsCorrect &&
                    !showAsWrong &&
                    'border-slate-300 text-slate-500',
                )}
              >
                {showAsCorrect ? (
                  <Check className="h-4 w-4" />
                ) : showAsWrong ? (
                  <X className="h-4 w-4" />
                ) : (
                  key
                )}
              </span>
              <span
                className={cn(
                  'text-slate-700',
                  showAsCorrect && 'font-semibold text-emerald-800',
                  showAsWrong && 'font-semibold text-rose-800',
                )}
              >
                {question.options[key]}
              </span>
            </button>
          )
        })}
      </div>

      {answered && (
        <div className="mt-4 animate-fade-in">
          <div
            className={cn(
              'flex items-center gap-2 text-sm font-semibold',
              isCorrect ? 'text-emerald-700' : 'text-rose-700',
            )}
          >
            {isCorrect ? (
              <>
                <Check className="h-4 w-4" /> Chính xác! Đáp án đúng là{' '}
                {question.correct}.
              </>
            ) : (
              <>
                <X className="h-4 w-4" /> Chưa đúng. Đáp án đúng là{' '}
                {question.correct}.
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowExplanation((s) => !s)}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
            aria-expanded={showExplanation}
          >
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform',
                showExplanation ? 'rotate-180' : 'rotate-0',
              )}
            />
            Xem giải thích chi tiết
          </button>

          {showExplanation && (
            <div className="mt-2 space-y-2 rounded-xl bg-slate-50 p-4 text-sm animate-fade-slide-up">
              <p className="leading-relaxed text-slate-700">
                {question.explanation}
              </p>
              {question.translation && (
                <p className="flex items-start gap-2 border-t border-slate-200 pt-2 italic text-slate-500">
                  <Languages className="mt-0.5 h-4 w-4 shrink-0" />
                  {question.translation}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
