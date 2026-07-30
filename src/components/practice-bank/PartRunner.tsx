import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, RotateCcw, Trophy } from 'lucide-react'
import { useSpeak } from '../../hooks/useSpeak'
import {
  PART_META,
  getPtLesson,
  practiceImageUrl,
  type Part,
  type PtLessonContent,
  type PtPassage,
  type PtQuestion,
} from '../../lib/practiceApi'
import { toSpokenLines } from '../../lib/speech'
import { QuestionBlock, SpeakButton } from './QuestionBlock'

interface Props {
  part: Part
  lesson: number
  onDone: () => void
}

/**
 * Các CÂU cần đọc cho một đơn vị nghe, MỖI CÂU MỘT DÒNG (đọc tuần tự, có ngắt nghỉ):
 *  - Part 1: 4 câu mô tả, mỗi câu kèm nhãn A–D ("A. …").
 *  - Part 2: câu hỏi trước, rồi 3 câu đáp kèm nhãn.
 *  - Part 3/4: tách kịch bản theo dòng (bỏ nhãn người nói).
 */
function speechLines(part: Part, q?: PtQuestion, body?: string): string[] {
  if (part === 1 && q)
    return (['A', 'B', 'C', 'D'] as const)
      .filter((k) => q.options[k])
      .map((k) => `${k}. ${q.options[k]}`)
  if (part === 2 && q)
    return [
      q.prompt ?? '',
      ...(['A', 'B', 'C'] as const).filter((k) => q.options[k]).map((k) => `${k}. ${q.options[k]}`),
    ].filter(Boolean)
  return toSpokenLines(body ?? '')
}

export function PartRunner({ part, lesson, onDone }: Props) {
  const { speakSequence, supported } = useSpeak()
  const [content, setContent] = useState<PtLessonContent | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [unit, setUnit] = useState(0)
  const [graded, setGraded] = useState(0) // số câu đã chấm trong đơn vị hiện tại
  const [correct, setCorrect] = useState(0)
  const [total, setTotal] = useState(0)
  const [finished, setFinished] = useState(false)
  const seq = useRef(0) // key để phát lại hiệu ứng vào đúng 1 lần mỗi đơn vị

  const meta = PART_META[part]

  const load = useCallback(async () => {
    setContent(null)
    setError(null)
    setUnit(0)
    setGraded(0)
    setCorrect(0)
    setTotal(0)
    setFinished(false)
    seq.current = 0
    try {
      setContent(await getPtLesson(part, lesson))
    } catch (e) {
      setError((e as Error).message)
    }
  }, [part, lesson])

  useEffect(() => {
    void load()
  }, [load])

  // Đơn vị điều hướng: Part 1/2/5 = từng câu; Part 3/4/6/7 = từng đoạn.
  const units = useMemo(() => {
    if (!content) return [] as ({ kind: 'q'; q: PtQuestion } | { kind: 'p'; p: PtPassage })[]
    if (part === 1 || part === 2 || part === 5)
      return content.questions.map((q) => ({ kind: 'q' as const, q }))
    return content.passages.map((p) => ({ kind: 'p' as const, p }))
  }, [content, part])

  const cur = units[unit]
  const unitQuestions = cur ? (cur.kind === 'q' ? [cur.q] : cur.p.questions) : []

  // tự đọc audio khi vào đơn vị mới (Part nghe) — đọc TỪNG CÂU tách riêng
  useEffect(() => {
    if (!cur || !supported || !meta.hasAudio) return
    const t = setTimeout(() => {
      if (cur.kind === 'q') speakSequence(speechLines(part, cur.q))
      else speakSequence(speechLines(part, undefined, cur.p.body))
    }, 350)
    return () => clearTimeout(t)
  }, [unit, content]) // eslint-disable-line react-hooks/exhaustive-deps

  const onGraded = useCallback((ok: boolean) => {
    setGraded((g) => g + 1)
    setTotal((t) => t + 1)
    if (ok) setCorrect((c) => c + 1)
  }, [])

  const allGraded = graded >= unitQuestions.length && unitQuestions.length > 0

  const next = () => {
    if (unit + 1 >= units.length) {
      setFinished(true)
      return
    }
    seq.current += 1
    setUnit(unit + 1)
    setGraded(0)
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="text-sm font-semibold text-rose-800">{error}</p>
        <button type="button" onClick={() => void load()}
          className="press mt-3 inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white">
          <RotateCcw className="h-4 w-4" /> Thử lại
        </button>
      </div>
    )
  }
  if (!content) {
    return (
      <div className="mx-auto max-w-2xl space-y-3">
        <div className="skeleton h-32 w-full rounded-2xl" />
        <div className="skeleton h-40 w-full rounded-2xl" />
      </div>
    )
  }

  // ---- Hoàn thành ----
  if (finished || units.length === 0) {
    const pct = total ? Math.round((correct / total) * 100) : 0
    return (
      <div className="mx-auto max-w-xl">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="flex flex-col items-center gap-2 bg-gradient-to-br from-violet-600 to-violet-800 p-8 text-center text-white">
            <Trophy className="h-10 w-10 animate-trophy-in" />
            <p className="text-4xl font-bold tabular-nums animate-pop">{pct}%</p>
            <p className="text-sm text-violet-100">
              {units.length === 0 ? 'Chưa có nội dung' : `Đúng ${correct}/${total} câu`}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 p-5">
            <button type="button" onClick={() => void load()}
              className="press inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <RotateCcw className="h-4 w-4" /> Làm lại
            </button>
            <button type="button" onClick={onDone}
              className="press inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-card hover:bg-violet-700">
              Xong <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-600">
          {cur?.kind === 'p' ? 'Đoạn' : 'Câu'} {unit + 1}/{units.length}
        </span>
        <span className="text-xs text-slate-400">{meta.hint}</span>
      </div>

      <div key={seq.current} className="animate-fade-slide-up space-y-4">
        {/* ---------- Ngữ ĐỀ theo part ---------- */}
        {cur?.kind === 'q' && part === 1 && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
            {cur.q.image ? (
              <img
                src={practiceImageUrl(cur.q.image)}
                alt="Ảnh Part 1"
                loading="lazy"
                className="max-h-80 w-full bg-slate-100 object-contain"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                }}
              />
            ) : (
              <div className="grid h-48 place-items-center bg-slate-100 text-sm text-slate-400">
                (không tải được ảnh)
              </div>
            )}
            <div className="flex items-center justify-center gap-3 p-4">
              {supported && (
                <SpeakButton big lines={speechLines(part, cur.q)} label="Nghe 4 câu" onSpeak={speakSequence} />
              )}
              <p className="text-sm text-slate-500">Nghe 4 câu và chọn câu tả đúng ảnh</p>
            </div>
          </div>
        )}

        {cur?.kind === 'q' && part === 2 && (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            {supported ? (
              <SpeakButton big lines={speechLines(part, cur.q)} label="Nghe câu hỏi và 3 đáp án" onSpeak={speakSequence} />
            ) : (
              <p className="text-lg font-semibold text-slate-800">{cur.q.prompt}</p>
            )}
            <p className="text-sm text-slate-500">Nghe câu hỏi và 3 câu đáp, chọn câu phù hợp nhất</p>
          </div>
        )}

        {cur?.kind === 'q' && part === 5 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-lg leading-relaxed text-slate-900 shadow-card">
            {cur.q.stem}
          </div>
        )}

        {cur?.kind === 'p' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            {cur.p.title && (
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                {cur.p.title}
              </p>
            )}
            {meta.hasAudio ? (
              <div className="flex items-center gap-3">
                {supported && <SpeakButton lines={speechLines(part, undefined, cur.p.body)} label="Nghe lại" onSpeak={speakSequence} />}
                <p className="text-sm text-slate-500">
                  {part === 3 ? 'Nghe đoạn hội thoại rồi trả lời' : 'Nghe bài nói rồi trả lời'}
                  {supported ? '' : ' (trình duyệt không hỗ trợ phát âm — đọc kịch bản bên dưới)'}
                </p>
              </div>
            ) : (
              <div className="whitespace-pre-line text-[15px] leading-relaxed text-slate-800">
                {cur.p.body}
              </div>
            )}
            {/* Nghe: hiện kịch bản chỉ khi trình duyệt không phát âm được */}
            {meta.hasAudio && !supported && (
              <div className="mt-3 whitespace-pre-line rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                {cur.p.body}
              </div>
            )}
          </div>
        )}

        {/* ---------- Câu hỏi ---------- */}
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          {unitQuestions.map((q, i) => (
            <div key={q.id} className={i > 0 ? 'border-t border-slate-100 pt-4' : ''}>
              <QuestionBlock
                question={q}
                audioOnly={part === 1 || part === 2}
                label={
                  cur?.kind === 'p'
                    ? part === 6
                      ? `Chỗ trống (${q.blankNo})`
                      : `Câu ${i + 1}. ${q.stem ?? ''}`
                    : undefined
                }
                onGraded={onGraded}
              />
            </div>
          ))}
        </div>

        {allGraded && (
          <button
            type="button"
            onClick={next}
            className="press inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white shadow-card hover:bg-violet-700"
          >
            {unit + 1 >= units.length ? 'Xem kết quả' : 'Tiếp theo'}{' '}
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
