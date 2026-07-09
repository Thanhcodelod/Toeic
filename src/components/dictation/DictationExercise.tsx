import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Eraser,
  Eye,
  RotateCcw,
  Trophy,
  X,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { AudioPlayer } from '../workspace/practice/AudioPlayer'
import {
  LEVEL_LABEL,
  isBlankCorrect,
  isSentenceCorrect,
  selectBlanks,
  tokenize,
  type DictLevel,
} from '../../lib/dictationBlanks'
import {
  dictationAudioUrl,
  recordDictationResult,
  type DictationItem,
  type DictationLine,
} from '../../lib/dictationApi'

interface Props {
  testTitle: string
  item: DictationItem
  lines: DictationLine[]
  onBack: () => void
  onCompleted: () => void
}

const partName = (p: number) =>
  ({ 1: 'Part 1 · Mô tả tranh', 2: 'Part 2 · Hỏi–đáp', 3: 'Part 3 · Hội thoại', 4: 'Part 4 · Bài nói' })[p] ?? `Part ${p}`

export function DictationExercise({ testTitle, item, lines, onBack, onCompleted }: Props) {
  const [level, setLevel] = useState<DictLevel>(2)
  const [idx, setIdx] = useState(0)
  const [inputs, setInputs] = useState<Record<number, string>>({})
  const [sentence, setSentence] = useState('')
  const [checked, setChecked] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(false)
  const scores = useRef<Record<number, { correct: number; total: number }>>({})
  const audioUrl = useMemo(() => dictationAudioUrl(item.audioPath), [item.audioPath])

  const line = lines[idx]
  const tokens = useMemo(() => (line ? tokenize(line.text) : []), [line])
  const blanks = useMemo(() => (line ? selectBlanks(line.text, level) : []), [line, level])

  // reset when the line or level changes
  useEffect(() => {
    setInputs({})
    setSentence('')
    setChecked(false)
    setRevealed(false)
  }, [idx, level])

  // restart the whole exercise if level changes
  useEffect(() => {
    scores.current = {}
    setIdx(0)
    setDone(false)
  }, [level])

  if (!line) return null

  const isWhole = level === 4
  const correctness = (i: number) => isBlankCorrect(inputs[i] ?? '', tokens[i].text)
  const wholeOk = isSentenceCorrect(sentence, line.text)

  const check = () => {
    if (checked) return
    setChecked(true)
    const total = isWhole ? 1 : blanks.length
    const correct = isWhole
      ? wholeOk ? 1 : 0
      : blanks.filter((i) => correctness(i)).length
    scores.current[idx] = { correct, total }
  }

  const reveal = () => {
    setRevealed(true)
    setChecked(true)
    if (isWhole) setSentence(line.text)
    else setInputs(Object.fromEntries(blanks.map((i) => [i, tokens[i].text])))
    // a revealed line scores 0
    scores.current[idx] = { correct: 0, total: isWhole ? 1 : blanks.length }
  }

  const finish = async () => {
    const all = Object.values(scores.current)
    const correct = all.reduce((s, r) => s + r.correct, 0)
    const total = all.reduce((s, r) => s + r.total, 0)
    setDone(true)
    try {
      await recordDictationResult(item.id, level, correct, total)
      onCompleted()
    } catch (e) {
      console.warn('Lưu tiến trình chép chính tả thất bại', e)
    }
  }

  const next = () => {
    if (!checked) { check(); return }
    if (idx + 1 >= lines.length) { void finish(); return }
    setIdx(idx + 1)
  }

  const restart = () => {
    scores.current = {}
    setIdx(0)
    setDone(false)
    setInputs({})
    setSentence('')
    setChecked(false)
    setRevealed(false)
  }

  // ---- Result ---------------------------------------------------------------
  if (done) {
    const all = Object.values(scores.current)
    const correct = all.reduce((s, r) => s + r.correct, 0)
    const total = all.reduce((s, r) => s + r.total, 0)
    const pct = total ? Math.round((correct / total) * 100) : 0
    return (
      <div className="mx-auto max-w-2xl">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="flex flex-col items-center gap-2 bg-gradient-to-br from-sky-600 to-sky-800 p-8 text-center text-white">
            <Trophy className="h-10 w-10" />
            <p className="text-4xl font-bold tabular-nums">{pct}%</p>
            <p className="text-sm text-sky-100">
              Đúng {correct}/{total} · mức {LEVEL_LABEL[level]}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 p-5">
            <button type="button" onClick={restart}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <RotateCcw className="h-4 w-4" /> Làm lại
            </button>
            <button type="button" onClick={onBack}
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-card hover:bg-sky-700">
              Chọn câu khác
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ---- Exercise -------------------------------------------------------------
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
          <ArrowLeft className="h-4 w-4" /> Danh sách câu
        </button>
        <div className="text-sm text-slate-500">
          <span className="font-semibold text-slate-800">{testTitle}</span>
          {' · '}{partName(item.part)}{' · '}
          <span className="font-semibold text-sky-700">
            câu {item.qFrom}{item.qTo !== item.qFrom ? `–${item.qTo}` : ''}
          </span>
        </div>
      </div>

      {/* Audio */}
      <AudioPlayer src={audioUrl} title="Nghe đoạn ghi âm" />

      {/* Level */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-600">Chọn chế độ:</span>
        {([1, 2, 3, 4] as DictLevel[]).map((l) => (
          <button key={l} type="button" onClick={() => setLevel(l)}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
              level === l
                ? 'border-sky-400 bg-sky-50 text-sky-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50',
            )}>
            {l === 4 ? LEVEL_LABEL[l] : `Điền từ (${LEVEL_LABEL[l].toLowerCase()})`}
          </button>
        ))}
      </div>

      {/* Sentence card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-600">Câu {idx + 1}/{lines.length}</span>
          {line.speaker && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {line.speaker}
            </span>
          )}
          {line.label && line.label !== 'Q' && (
            <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-bold text-sky-700">
              {line.label}
            </span>
          )}
        </div>

        {isWhole ? (
          <div>
            <textarea
              value={sentence}
              onChange={(e) => setSentence(e.target.value)}
              disabled={checked}
              rows={3}
              placeholder="Nghe rồi chép lại toàn bộ câu…"
              className={cn(
                'w-full rounded-xl border px-4 py-3 text-[15px] outline-none transition-colors',
                checked
                  ? wholeOk ? 'border-emerald-400 bg-emerald-50' : 'border-rose-400 bg-rose-50'
                  : 'border-slate-200 focus:border-sky-500',
              )}
            />
            {checked && !wholeOk && (
              <p className="mt-2 text-sm text-slate-700">
                <span className="font-semibold text-emerald-600">Đáp án: </span>{line.text}
              </p>
            )}
          </div>
        ) : (
          <p className="flex flex-wrap items-center gap-x-1.5 gap-y-3 text-lg leading-loose text-slate-800">
            {tokens.map((tk, i) => {
              if (!tk.isWord) return <span key={i}>{tk.text}</span>
              if (!blanks.includes(i)) return <span key={i}>{tk.text}</span>
              const ok = correctness(i)
              return (
                <span key={i} className="inline-flex flex-col items-center">
                  <input
                    value={inputs[i] ?? ''}
                    disabled={checked}
                    onChange={(e) => setInputs((p) => ({ ...p, [i]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') next() }}
                    style={{ width: `${Math.max(4, tk.text.length + 1)}ch` }}
                    className={cn(
                      'border-b-2 bg-transparent px-1 text-center text-[17px] outline-none',
                      checked
                        ? ok
                          ? 'border-emerald-500 text-emerald-700'
                          : revealed
                            ? 'border-sky-500 text-sky-700'
                            : 'border-rose-500 text-rose-700'
                        : 'border-slate-300 focus:border-sky-500',
                    )}
                  />
                  {checked && !ok && !revealed && (
                    <span className="text-xs font-semibold text-emerald-600">{tk.text}</span>
                  )}
                </span>
              )
            })}
          </p>
        )}

        {checked && !isWhole && (
          <p className="mt-4 flex items-center gap-2 text-sm">
            {scores.current[idx]?.correct === blanks.length ? (
              <><Check className="h-4 w-4 text-emerald-600" /><span className="text-emerald-700">Chính xác!</span></>
            ) : (
              <><X className="h-4 w-4 text-rose-600" /><span className="text-slate-600">
                Đúng {scores.current[idx]?.correct ?? 0}/{blanks.length} từ
              </span></>
            )}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button type="button" disabled={idx === 0} onClick={() => setIdx(idx - 1)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 enabled:hover:bg-slate-50 disabled:opacity-40">
          <ChevronLeft className="h-4 w-4" /> Câu trước
        </button>
        <button type="button" onClick={() => { setInputs({}); setSentence('') }} disabled={checked}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 enabled:hover:bg-slate-50 disabled:opacity-40">
          <Eraser className="h-4 w-4" /> Xoá hết
        </button>
        <button type="button" onClick={reveal} disabled={revealed}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 enabled:hover:bg-slate-50 disabled:opacity-40">
          <Eye className="h-4 w-4" /> Đáp án
        </button>
        <button type="button" onClick={next}
          className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-bold text-white shadow-card hover:bg-sky-700">
          {!checked ? (<><Check className="h-4 w-4" /> Kiểm tra</>)
            : idx + 1 >= lines.length ? (<>Xem kết quả</>)
              : (<>Câu sau <ChevronRight className="h-4 w-4" /></>)}
        </button>
      </div>

      <p className="text-center text-xs text-slate-400">
        Mẹo: nhấn Enter để kiểm tra / sang câu tiếp. Audio là trọn đoạn của câu {item.qFrom}
        {item.qTo !== item.qFrom ? `–${item.qTo}` : ''} — bấm “Nghe lại” trên trình phát khi cần.
      </p>
    </div>
  )
}
