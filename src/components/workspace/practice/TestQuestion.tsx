import { Headphones } from 'lucide-react'
import { cn } from '../../../lib/cn'
import type { OptionKey, QuizQuestion } from '../../../data/types'

const ALL_KEYS: OptionKey[] = ['A', 'B', 'C', 'D']

interface TestQuestionProps {
  question: QuizQuestion
  index: number
  selected?: OptionKey
  onSelect: (key: OptionKey) => void
  disabled?: boolean
  /** Listening Part 1/2: the options are spoken, so hide their text and show
   *  only the A/B/C/D bubbles until the test is submitted. */
  hideOptionText?: boolean
}

/** A single mini-test item: question + selectable options, no feedback until submit. */
export function TestQuestion({
  question,
  index,
  selected,
  onSelect,
  disabled = false,
  hideOptionText = false,
}: TestQuestionProps) {
  const optionKeys = question.numOptions === 3 ? ALL_KEYS.slice(0, 3) : ALL_KEYS
  return (
    <div id={`cau-${index + 1}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-start gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-sm font-bold text-slate-600">
          {index + 1}
        </span>
        <p className="pt-0.5 text-[15px] font-medium leading-relaxed text-slate-900">
          {question.question}
        </p>
      </div>

      {question.imageUrl && (
        <img
          src={question.imageUrl}
          alt="Ảnh minh hoạ câu hỏi"
          loading="lazy"
          className="mt-4 max-h-72 w-full rounded-xl object-cover"
        />
      )}

      {hideOptionText ? (
        <>
          <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Headphones className="h-3.5 w-3.5 text-brand-600" />
            Nghe đoạn ghi âm và chọn đáp án đúng (nội dung các lựa chọn sẽ hiện
            sau khi nộp bài).
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {optionKeys.map((key) => {
              const isSelected = key === selected
              return (
                <button
                  key={key}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelect(key)}
                  aria-pressed={isSelected}
                  aria-label={`Đáp án ${key}`}
                  className={cn(
                    'press grid h-12 w-12 place-items-center rounded-full border text-base font-bold',
                    isSelected
                      ? 'border-brand-600 bg-brand-600 text-white ring-2 ring-brand-200'
                      : 'border-slate-300 text-slate-600 enabled:hover:border-brand-400 enabled:hover:bg-brand-50',
                    disabled && 'cursor-not-allowed opacity-70',
                  )}
                >
                  {key}
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {optionKeys.map((key) => {
            const isSelected = key === selected
            return (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onClick={() => onSelect(key)}
                aria-pressed={isSelected}
                className={cn(
                  'press flex items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-sm',
                  isSelected
                    ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-200'
                    : 'border-slate-200 enabled:hover:border-brand-300 enabled:hover:bg-slate-50',
                  disabled && 'cursor-not-allowed opacity-70',
                )}
              >
                <span
                  className={cn(
                    'grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-bold',
                    isSelected
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-slate-300 text-slate-500',
                  )}
                >
                  {key}
                </span>
                <span className="text-slate-700">{question.options[key]}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
