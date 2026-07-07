import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { cn } from '../../../lib/cn'
import { fetchExamKeyForDay, reviewMistakes } from '../../../lib/api'
import type { ExamAnswerKey } from '../../../lib/api'
import type { OptionKey } from '../../../data/types'

const PART_LABEL: Record<number, string> = {
  1: 'Part 1 · Mô tả tranh',
  2: 'Part 2 · Hỏi–đáp',
  3: 'Part 3 · Hội thoại',
  4: 'Part 4 · Bài nói',
  5: 'Part 5 · Hoàn thành câu',
  6: 'Part 6 · Hoàn thành đoạn',
  7: 'Part 7 · Đọc hiểu',
}

interface AiSummary {
  summary?: string
  weakest?: string
  advice?: string[]
  raw?: string
}

interface MistakeReviewProps {
  reviewOfDay: number
  onSelectDay: (day: number) => void
}

function readExamAnswers(day: number): Record<string, OptionKey> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(`toeic90:exam:${day}:answers`)
    return raw ? (JSON.parse(raw) as Record<string, OptionKey>) : {}
  } catch {
    return {}
  }
}

export function MistakeReview({ reviewOfDay, onSelectDay }: MistakeReviewProps) {
  const [key, setKey] = useState<ExamAnswerKey | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ai, setAi] = useState<AiSummary | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const answers = useMemo(() => readExamAnswers(reviewOfDay), [reviewOfDay])

  useEffect(() => {
    let ignore = false
    setLoading(true)
    fetchExamKeyForDay(reviewOfDay)
      .then((k) => {
        if (!ignore) {
          setKey(k)
          setLoading(false)
        }
      })
      .catch((e: unknown) => {
        if (!ignore) {
          setError((e as Error)?.message ?? 'Lỗi tải đề')
          setLoading(false)
        }
      })
    return () => {
      ignore = true
    }
  }, [reviewOfDay])

  const attempted = Object.keys(answers).length > 0

  // Questions the user answered but got wrong.
  const wrong = useMemo(() => {
    if (!key) return []
    return key.answers.filter(
      (q) => answers[String(q.qNumber)] && answers[String(q.qNumber)] !== q.correct,
    )
  }, [key, answers])

  const byPart = useMemo(() => {
    const m: Record<number, number> = {}
    for (const w of wrong) m[w.part] = (m[w.part] || 0) + 1
    return m
  }, [wrong])

  const runAi = async () => {
    if (!key) return
    setAiLoading(true)
    setAiError(null)
    try {
      const res = await reviewMistakes({
        mode: 'summary',
        testName: key.title,
        total: wrong.length,
        byPart,
      })
      setAi(res as AiSummary)
    } catch (e) {
      setAiError((e as Error)?.message ?? 'Lỗi gọi AI')
    } finally {
      setAiLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" /> Đang tải…
      </div>
    )
  }

  if (error || !key) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center text-sm text-slate-500">
        {error ?? 'Chưa có dữ liệu đề để ôn tập.'}
      </div>
    )
  }

  // Not attempted yet → guide the user to take the test first.
  if (!attempted) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
        <h3 className="mt-3 text-base font-bold text-slate-900">
          Bạn chưa làm {key.title}
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Hãy làm bài thi ở Ngày {reviewOfDay} trước, rồi quay lại đây để ôn các
          câu sai.
        </p>
        <button
          type="button"
          onClick={() => onSelectDay(reviewOfDay)}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-card hover:bg-brand-700"
        >
          Đi tới Ngày {reviewOfDay} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    )
  }

  if (wrong.length === 0) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
        <h3 className="mt-3 text-base font-bold text-slate-900">
          Không có câu sai nào — tuyệt vời!
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Bạn đã trả lời đúng tất cả các câu đã làm trong {key.title}.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Wrong-answer summary */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <h3 className="text-base font-bold text-slate-900">
          Ôn câu sai — {key.title}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Bạn làm sai <span className="font-bold text-rose-600">{wrong.length}</span>{' '}
          câu. Phân bố theo phần:
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {Object.entries(byPart)
            .sort((a, b) => Number(a[0]) - Number(b[0]))
            .map(([part, n]) => (
              <div
                key={part}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"
              >
                <span className="text-slate-700">
                  {PART_LABEL[Number(part)] ?? `Part ${part}`}
                </span>
                <span className="font-bold text-rose-600">{n} câu</span>
              </div>
            ))}
        </div>

        {/* Wrong question numbers (to look up in the đề) */}
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-700">
            Xem số thứ tự các câu sai
          </summary>
          <p className="mt-2 text-sm text-slate-600">
            {wrong.map((w) => `#${w.qNumber}`).join(', ')}
          </p>
        </details>
      </div>

      {/* AI analysis */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-600" />
          <h3 className="text-base font-bold text-slate-900">AI phân tích</h3>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Đề ETS là ảnh scan (không có chữ), nên AI phân tích theo phần yếu +
          chiến lược luyện tập.
        </p>

        {!ai && (
          <button
            type="button"
            onClick={runAi}
            disabled={aiLoading}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-card hover:bg-brand-700 disabled:opacity-60"
          >
            {aiLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Đang phân tích…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Phân tích câu sai bằng AI
              </>
            )}
          </button>
        )}

        {aiError && (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {aiError}
          </p>
        )}

        {ai && (
          <div className="mt-3 space-y-3 text-sm">
            {ai.summary && (
              <p className="leading-relaxed text-slate-700">{ai.summary}</p>
            )}
            {ai.weakest && (
              <div className="rounded-xl bg-rose-50 p-3 text-rose-800">
                <span className="font-semibold">Phần yếu nhất: </span>
                {ai.weakest}
              </div>
            )}
            {ai.advice && ai.advice.length > 0 && (
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="mb-2 font-semibold text-slate-800">
                  Lời khuyên luyện tập
                </p>
                <ul className="space-y-1.5">
                  {ai.advice.map((a, i) => (
                    <li key={i} className="flex gap-2 text-slate-700">
                      <span className="text-brand-500">•</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {ai.raw && !ai.summary && (
              <p className="whitespace-pre-line text-slate-700">{ai.raw}</p>
            )}
            <button
              type="button"
              onClick={runAi}
              disabled={aiLoading}
              className={cn(
                'text-xs font-medium text-brand-600 hover:underline',
                aiLoading && 'opacity-50',
              )}
            >
              Phân tích lại
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
