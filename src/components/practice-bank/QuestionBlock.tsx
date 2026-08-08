import { useState } from 'react'
import { Check, Loader2, Volume2, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { answerPt, type OptionKey, type PtAnswer, type PtQuestion } from '../../lib/practiceApi'
import type { SpeechTurn } from '../../lib/speech'

interface Props {
  question: PtQuestion
  /** Ẩn nội dung phương án cho tới khi nộp (Part 1 & 2 — chỉ nghe rồi chọn A/B/C/D). */
  audioOnly?: boolean
  /** Đề câu hỏi hiển thị phía trên (Part 3/4/7). Part 6 dùng số chỗ trống. */
  label?: string
  onGraded?: (correct: boolean) => void
}

const LETTERS: OptionKey[] = ['A', 'B', 'C', 'D']

/**
 * Một câu hỏi trắc nghiệm tự chấm. Gửi đáp án lên server (answer_pt) — server tra
 * đáp án đúng và trả về đúng/sai + lời giải; client không biết đáp án trước khi nộp.
 */
export function QuestionBlock({ question, audioOnly, label, onGraded }: Props) {
  const [picked, setPicked] = useState<OptionKey | null>(question.chosen ?? null)
  const [res, setRes] = useState<PtAnswer | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const keys = LETTERS.filter((k) => question.options[k] != null)

  const submit = async () => {
    if (!picked || res || busy) return
    setBusy(true)
    setErr(null)
    try {
      const r = await answerPt(question.id, picked)
      setRes(r)
      onGraded?.(r.correct)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      {label && <p className="mb-2 text-sm font-semibold text-slate-800">{label}</p>}

      <div className={cn('grid gap-2', res && !res.correct && 'animate-shake')}>
        {keys.map((k) => {
          const isPicked = picked === k
          const showCorrect = res && res.correctOption === k
          const showWrong = res && isPicked && !res.correct
          // Trước khi nộp mà audioOnly thì chỉ hiện chữ cái; sau khi nộp hiện đủ.
          const text =
            audioOnly && !res ? '' : res?.options?.[k] ?? question.options[k] ?? ''
          return (
            <button
              key={k}
              type="button"
              disabled={!!res}
              onClick={() => setPicked(k)}
              className={cn(
                'press flex items-start gap-2.5 rounded-xl border px-4 py-3 text-left text-sm',
                showCorrect && 'border-emerald-400 bg-emerald-50',
                showWrong && 'border-rose-400 bg-rose-50',
                !res && isPicked && 'border-violet-500 bg-violet-50 ring-1 ring-violet-200',
                !res && !isPicked && 'border-slate-200 hover:border-violet-300 hover:bg-slate-50',
                res && !showCorrect && !showWrong && 'opacity-60',
              )}
            >
              <span
                className={cn(
                  'grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold',
                  showCorrect
                    ? 'bg-emerald-500 text-white'
                    : showWrong
                      ? 'bg-rose-500 text-white'
                      : isPicked
                        ? 'bg-violet-500 text-white'
                        : 'bg-slate-100 text-slate-500',
                )}
              >
                {showCorrect ? (
                  <Check className="h-3.5 w-3.5" />
                ) : showWrong ? (
                  <X className="h-3.5 w-3.5" />
                ) : (
                  k
                )}
              </span>
              {text && <span className="pt-0.5 text-slate-800">{text}</span>}
              {audioOnly && !res && (
                <span className="pt-0.5 text-slate-400">Phương án {k}</span>
              )}
            </button>
          )
        })}
      </div>

      {err && <p className="mt-2 text-sm text-rose-600">{err}</p>}

      {/* Lời giải sau khi chấm */}
      {res && res.explanation && (
        <div
          className={cn(
            'animate-fade-slide-down mt-3 rounded-xl p-3 text-sm',
            res.correct ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900',
          )}
        >
          <p className="flex items-center gap-1.5 font-bold">
            {res.correct ? (
              <>
                <Check className="h-4 w-4 animate-pop text-emerald-600" /> Chính xác!
              </>
            ) : (
              <>
                <X className="h-4 w-4 text-rose-600" /> Đáp án đúng: {res.correctOption}
              </>
            )}
          </p>
          <p className="mt-1 leading-relaxed">{res.explanation}</p>
        </div>
      )}

      {!res && (
        <button
          type="button"
          onClick={() => void submit()}
          disabled={!picked || busy}
          className="press mt-3 inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white shadow-card hover:bg-violet-700 disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Kiểm tra
        </button>
      )}
    </div>
  )
}

/** Nút phát âm (Part 1/2/3/4) — đọc TỪNG CÂU tách riêng qua speechSynthesis. */
export function SpeakButton({
  lines,
  label,
  big,
  onSpeak,
}: {
  lines: SpeechTurn[]
  label: string
  big?: boolean
  onSpeak: (lines: SpeechTurn[]) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSpeak(lines)}
      aria-label={label}
      className={cn(
        'press grid shrink-0 place-items-center rounded-full bg-violet-100 text-violet-700 hover:bg-violet-200',
        big ? 'h-16 w-16' : 'h-10 w-10',
      )}
    >
      <Volume2 className={big ? 'h-7 w-7' : 'h-5 w-5'} />
    </button>
  )
}
