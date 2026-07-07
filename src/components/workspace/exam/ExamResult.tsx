import { Check, RotateCcw, Trophy, X } from 'lucide-react'
import { cn } from '../../../lib/cn'
import { listeningScaled, readingScaled } from '../../../lib/toeicScore'
import { PART_NAMES } from './ExamAnswerGrid'
import type { ExamContent, OptionKey } from '../../../data/types'

interface ExamResultProps {
  content: ExamContent
  answers: Record<number, OptionKey>
  onRetry: () => void
}

export function ExamResult({ content, answers, onRetry }: ExamResultProps) {
  const mode = content.mode
  const done = content.answers.filter((it) =>
    mode === 'listening'
      ? it.qNumber <= 100
      : mode === 'reading'
        ? it.qNumber > 100
        : true,
  )

  const lc = done.filter((it) => it.qNumber <= 100)
  const rc = done.filter((it) => it.qNumber > 100)
  const isCorrect = (q: number, c: OptionKey) => answers[q] === c
  const lcCorrect = lc.filter((it) => isCorrect(it.qNumber, it.correct)).length
  const rcCorrect = rc.filter((it) => isCorrect(it.qNumber, it.correct)).length
  const totalCorrect = lcCorrect + rcCorrect
  const totalQ = done.length

  const lcScaled = listeningScaled(lcCorrect)
  const rcScaled = readingScaled(rcCorrect)
  const showLc = lc.length > 0
  const showRc = rc.length > 0
  const totalScaled = (showLc ? lcScaled : 0) + (showRc ? rcScaled : 0)

  // Group done items by part for the review.
  const groups: { part: number; items: typeof done }[] = []
  for (const it of done) {
    let g = groups[groups.length - 1]
    if (!g || g.part !== it.part) {
      g = { part: it.part, items: [] }
      groups.push(g)
    }
    g.items.push(it)
  }

  return (
    <div className="space-y-6 animate-fade-slide-up">
      {/* Score card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="flex flex-col items-center gap-5 bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white sm:flex-row sm:justify-between sm:p-8">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/15">
              <Trophy className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm text-brand-100">
                {content.title} · {mode === 'full' ? 'Full test' : mode === 'listening' ? 'Listening' : 'Reading'}
              </p>
              <p className="text-4xl font-bold tabular-nums">
                {totalScaled}
                <span className="ml-1 text-lg font-medium text-brand-100">
                  điểm (ước lượng)
                </span>
              </p>
              <p className="text-sm text-brand-100">
                Đúng {totalCorrect}/{totalQ} câu ·{' '}
                {Math.round((totalCorrect / totalQ) * 100)}%
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
          >
            <RotateCcw className="h-4 w-4" />
            Làm lại
          </button>
        </div>

        <div className="grid grid-cols-2 divide-x divide-slate-200 text-center sm:grid-cols-4">
          {showLc && (
            <div className="p-3">
              <p className="text-xl font-bold text-slate-900">{lcScaled}</p>
              <p className="text-xs text-slate-500">Listening (ước lượng)</p>
            </div>
          )}
          {showRc && (
            <div className="p-3">
              <p className="text-xl font-bold text-slate-900">{rcScaled}</p>
              <p className="text-xs text-slate-500">Reading (ước lượng)</p>
            </div>
          )}
          <div className="p-3">
            <p className="text-xl font-bold text-emerald-600">{totalCorrect}</p>
            <p className="text-xs text-slate-500">Câu đúng</p>
          </div>
          <div className="p-3">
            <p className="text-xl font-bold text-rose-600">
              {totalQ - totalCorrect}
            </p>
            <p className="text-xs text-slate-500">Câu sai/bỏ trống</p>
          </div>
        </div>
      </div>

      <p className="rounded-xl bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
        Điểm quy đổi chỉ mang tính <strong>ước lượng tham khảo</strong> — thang
        điểm chính thức thay đổi theo từng đề của ETS.
      </p>

      {/* Review */}
      <div>
        <h3 className="mb-3 text-base font-bold text-slate-900">
          Bảng kết quả chi tiết
        </h3>
        <div className="space-y-4">
          {groups.map((g) => (
            <div
              key={g.part}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card"
            >
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-700">
                {PART_NAMES[g.part] ?? `Part ${g.part}`}
              </h4>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-6">
                {g.items.map((it) => {
                  const your = answers[it.qNumber]
                  const ok = your === it.correct
                  return (
                    <div
                      key={it.qNumber}
                      className={cn(
                        'flex items-center justify-between rounded-lg border px-2 py-1.5 text-xs',
                        ok
                          ? 'border-emerald-200 bg-emerald-50'
                          : 'border-rose-200 bg-rose-50',
                      )}
                    >
                      <span className="font-semibold tabular-nums text-slate-600">
                        {it.qNumber}
                      </span>
                      <span className="flex items-center gap-1">
                        {ok ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <>
                            <span className="text-rose-500 line-through">
                              {your ?? '—'}
                            </span>
                            <X className="h-3 w-3 text-rose-400" />
                            <span className="font-bold text-emerald-700">
                              {it.correct}
                            </span>
                          </>
                        )}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
