import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, Loader2, PenLine, Sparkles, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import {
  gradeWriting,
  getWritingPrompts,
  saveWriting,
  type WritingPrompt,
  type WritingScore,
} from '../../lib/writingApi'

const countWords = (s: string) => (s.trim().match(/\S+/g) ?? []).length
const scoreColor = (n: number) => (n >= 75 ? 'text-emerald-600' : n >= 50 ? 'text-amber-600' : 'text-rose-600')

export function WritingTab() {
  const [prompts, setPrompts] = useState<WritingPrompt[] | null>(null)
  const [active, setActive] = useState<WritingPrompt | null>(null)
  const [text, setText] = useState('')
  const [result, setResult] = useState<WritingScore | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    getWritingPrompts().then(setPrompts).catch(() => setPrompts([]))
  }, [])

  const words = useMemo(() => countWords(text), [text])

  const submit = async () => {
    if (!active || busy || words < 10) return
    setBusy(true)
    setErr(null)
    try {
      const r = await gradeWriting(active.prompt, text)
      setResult(r)
      saveWriting(active.id, text, r).catch(() => {})
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const reset = () => {
    setActive(null)
    setText('')
    setResult(null)
    setErr(null)
  }

  if (!prompts)
    return <div className="flex items-center justify-center gap-2 py-16 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /> Đang tải đề…</div>

  // ---- Chọn đề ----
  if (!active)
    return (
      <div className="mx-auto max-w-2xl">
        <p className="mb-3 text-center text-sm text-slate-500">Chọn một đề để luyện viết. AI sẽ chấm điểm, chữa lỗi và cho bài mẫu.</p>
        <div className="stagger grid gap-2">
          {prompts.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActive(p)}
              className="lift press flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-card hover:border-teal-300"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-100 text-teal-700">
                <PenLine className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900">{p.title}</p>
                <p className="text-xs text-slate-500">
                  {p.kind === 'email' ? 'Viết email' : 'Viết luận nêu ý kiến'} · ≥ {p.minWords} từ
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    )

  // ---- Kết quả ----
  if (result)
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <button type="button" onClick={reset} className="press inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
          <ArrowLeft className="h-4 w-4" /> Đề khác
        </button>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-card">
          {result.overall != null && <p className={cn('text-5xl font-bold tabular-nums', scoreColor(result.overall))}>{result.overall}<span className="text-lg text-slate-400">/100</span></p>}
          {result.scores && (
            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
              {[['Nhiệm vụ', result.scores.task], ['Ngữ pháp', result.scores.grammar], ['Từ vựng', result.scores.vocabulary], ['Mạch lạc', result.scores.coherence]].map(([l, v]) => (
                <div key={l as string} className="rounded-lg bg-slate-50 p-2">
                  <p className={cn('text-lg font-bold tabular-nums', scoreColor(v as number))}>{v as number}</p>
                  <p className="text-[10px] text-slate-500">{l as string}</p>
                </div>
              ))}
            </div>
          )}
          {result.feedback && <p className="mt-3 text-sm text-slate-700">{result.feedback}</p>}
        </div>

        {result.corrections.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h3 className="text-sm font-bold text-slate-900">Chữa lỗi</h3>
            <div className="mt-3 space-y-2">
              {result.corrections.map((c, i) => (
                <div key={i} className="rounded-xl bg-slate-50 p-3 text-sm">
                  <p className="flex items-start gap-1.5 text-rose-600"><X className="mt-0.5 h-4 w-4 shrink-0" /><span className="line-through">{c.original}</span></p>
                  <p className="mt-1 flex items-start gap-1.5 text-emerald-700"><Check className="mt-0.5 h-4 w-4 shrink-0" /><span>{c.fixed}</span></p>
                  {c.note && <p className="mt-1 text-xs italic text-slate-500">{c.note}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {result.modelAnswer && (
          <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-5 shadow-card">
            <h3 className="flex items-center gap-1.5 text-sm font-bold text-teal-800"><Sparkles className="h-4 w-4" /> Bài mẫu</h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">{result.modelAnswer}</p>
          </div>
        )}
      </div>
    )

  // ---- Viết bài ----
  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <button type="button" onClick={reset} className="press inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
        <ArrowLeft className="h-4 w-4" /> Đề khác
      </button>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <p className="text-xs font-bold uppercase tracking-wide text-teal-600">{active.title}</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-800">{active.prompt}</p>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        autoFocus
        placeholder="Viết bài của bạn bằng tiếng Anh…"
        className="w-full rounded-2xl border border-slate-200 p-4 text-[15px] leading-relaxed outline-none focus:border-teal-500"
      />
      <div className="flex items-center justify-between">
        <span className={cn('text-xs font-medium tabular-nums', words >= active.minWords ? 'text-emerald-600' : 'text-slate-400')}>
          {words} từ {words < active.minWords && `· cần ≥ ${active.minWords}`}
        </span>
        {err && <span className="text-xs text-rose-600">{err}</span>}
        <button
          type="button"
          onClick={() => void submit()}
          disabled={busy || words < 10}
          className="press inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-card hover:bg-teal-700 disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Chấm bài (AI)
        </button>
      </div>
    </div>
  )
}
