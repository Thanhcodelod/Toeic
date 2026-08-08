import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ClipboardCheck,
  Clock,
  Loader2,
  Trophy,
  Volume2,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { UserMenu } from '../../auth/UserMenu'
import { useSpeak } from '../../hooks/useSpeak'
import { toSpokenTurns } from '../../lib/speech'
import { SpeedControl } from '../common/SpeedControl'
import { estimateScore } from '../../lib/toeicScore'
import { PART_META, practiceImageUrl, type OptionKey } from '../../lib/practiceApi'
import {
  MOCK_LABEL,
  MOCK_MINUTES,
  getMockTest,
  gradeMock,
  type MockPassage,
  type MockQuestion,
  type MockResult,
  type MockScope,
  type MockTest,
} from '../../lib/mockApi'

type Phase = 'setup' | 'running' | 'result'
const LETTERS: OptionKey[] = ['A', 'B', 'C', 'D']
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export function MockTestPage({ onBack }: { onBack: () => void }) {
  const { speakSequence, supported } = useSpeak()
  const [phase, setPhase] = useState<Phase>('setup')
  const [test, setTest] = useState<MockTest | null>(null)
  const [answers, setAnswers] = useState<Record<number, OptionKey>>({})
  const [left, setLeft] = useState(0)
  const [result, setResult] = useState<MockResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const startedAt = useRef(0)

  // đơn vị theo thứ tự: nghe (Part 1-4) rồi đọc (5-7)
  const units = useMemo(() => {
    if (!test) return [] as ({ kind: 'q'; q: MockQuestion } | { kind: 'p'; p: MockPassage })[]
    const qs = test.standalone.map((q) => ({ kind: 'q' as const, q }))
    const ps = test.passages.map((p) => ({ kind: 'p' as const, p }))
    return [...qs, ...ps].sort((a, b) => {
      const pa = a.kind === 'q' ? a.q.part : a.p.part
      const pb = b.kind === 'q' ? b.q.part : b.p.part
      return pa - pb
    })
  }, [test])

  const totalQ = useMemo(
    () => (test ? test.standalone.length + test.passages.reduce((s, p) => s + p.questions.length, 0) : 0),
    [test],
  )
  const answered = Object.keys(answers).length

  const submit = useCallback(async () => {
    if (!test || busy) return
    setBusy(true)
    try {
      const secs = Math.round((Date.now() - startedAt.current) / 1000)
      const r = await gradeMock(test.scope, answers, secs)
      setResult(r)
      setPhase('result')
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }, [test, answers, busy])

  // đồng hồ đếm ngược
  useEffect(() => {
    if (phase !== 'running') return
    const id = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          clearInterval(id)
          void submit()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [phase, submit])

  const start = async (sc: MockScope) => {
    setBusy(true)
    setErr(null)
    try {
      const t = await getMockTest(sc)
      setTest(t)
      setAnswers({})
      setResult(null)
      setLeft(MOCK_MINUTES[sc] * 60)
      startedAt.current = Date.now()
      setPhase('running')
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const pick = (qid: number, k: OptionKey) => setAnswers((a) => ({ ...a, [qid]: k }))

  const speakQ = (u: { kind: 'q'; q: MockQuestion } | { kind: 'p'; p: MockPassage }) => {
    if (u.kind === 'q') {
      if (u.q.part === 1)
        speakSequence(LETTERS.filter((k) => u.q.options[k]).map((k) => ({ text: `${k}. ${u.q.options[k]}` })))
      else if (u.q.part === 2)
        speakSequence([
          ...(u.q.prompt ? [{ text: u.q.prompt, speaker: 'q' }] : []),
          ...(['A', 'B', 'C'] as OptionKey[]).filter((k) => u.q.options[k]).map((k) => ({ text: `${k}. ${u.q.options[k]}`, speaker: 'r' })),
        ])
    } else {
      speakSequence(toSpokenTurns(u.p.body))
    }
  }

  const header = (right?: React.ReactNode) => (
    <header className="z-20 shrink-0 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
        <button type="button" onClick={onBack} className="press inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
          <ArrowLeft className="h-4 w-4" /> Lộ trình 90 ngày
        </button>
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-card">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <h1 className="text-sm font-bold text-slate-900 sm:text-base">Đề mô phỏng</h1>
        </div>
        <div className="ml-auto flex items-center gap-3">{right}<UserMenu /></div>
      </div>
    </header>
  )

  // ---------- Setup ----------
  if (phase === 'setup') {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        {header()}
        <main className="thin-scrollbar flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto max-w-2xl">
            <p className="mb-4 text-center text-sm text-slate-500">
              Đề ghép từ ngân hàng câu hỏi <b>nguyên gốc</b> của app, bấm giờ và tự chấm. Chọn loại đề:
            </p>
            <div className="stagger grid gap-3">
              {(['placement', 'mini', 'full'] as MockScope[]).map((sc) => (
                <button
                  key={sc}
                  type="button"
                  disabled={busy}
                  onClick={() => void start(sc)}
                  className="lift press flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-card hover:border-rose-300 disabled:opacity-60"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-rose-100 text-rose-700">
                    <Clock className="h-6 w-6" />
                  </span>
                  <div className="flex-1">
                    <p className="text-base font-bold text-slate-900">{MOCK_LABEL[sc]}</p>
                    <p className="text-sm text-slate-500">
                      {sc === 'placement' && 'Ngắn — ước lượng trình độ hiện tại của bạn.'}
                      {sc === 'mini' && 'Vừa — luyện nhịp làm bài nhanh gọn.'}
                      {sc === 'full' && 'Đủ 7 part — mô phỏng sát phòng thi.'}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-rose-600">{MOCK_MINUTES[sc]}′</span>
                </button>
              ))}
            </div>
            {busy && <p className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Đang tạo đề…</p>}
            {err && <p className="mt-4 text-center text-sm text-rose-600">{err}</p>}
          </div>
        </main>
      </div>
    )
  }

  // ---------- Result ----------
  if (phase === 'result' && result) {
    const est = estimateScore(
      result.lcTotal ? Math.round((result.lcCorrect / result.lcTotal) * 100) : 0,
      result.rcTotal ? Math.round((result.rcCorrect / result.rcTotal) * 100) : 0,
    )
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        {header()}
        <main className="thin-scrollbar flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto max-w-2xl space-y-5">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-center shadow-card">
              <div className="flex flex-col items-center gap-2 bg-gradient-to-br from-rose-600 to-rose-800 p-8 text-white">
                <Trophy className="h-10 w-10 animate-trophy-in" />
                <p className="text-5xl font-bold tabular-nums animate-pop">{est.total}</p>
                <p className="text-sm text-rose-100">/ 990 điểm ước tính · CEFR {est.cefr}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 p-5">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xl font-bold text-slate-900">{est.lc}</p>
                  <p className="text-xs text-slate-500">Nghe · {result.lcCorrect}/{result.lcTotal} câu</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xl font-bold text-slate-900">{est.rc}</p>
                  <p className="text-xs text-slate-500">Đọc · {result.rcCorrect}/{result.rcTotal} câu</p>
                </div>
              </div>
              <p className="px-5 pb-4 text-xs text-slate-400">{est.cefrNote} · Điểm là ước tính tham khảo.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <h2 className="text-sm font-bold text-slate-900">Đúng theo từng part</h2>
              <div className="mt-3 space-y-2">
                {result.byPart.map((b) => {
                  const pct = b.total ? Math.round((b.correct / b.total) * 100) : 0
                  return (
                    <div key={b.part} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 text-xs font-medium text-slate-600">{PART_META[b.part as 1]?.label ?? `Part ${b.part}`}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div className={cn('bar-fill h-full rounded-full', pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-rose-500')} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-14 shrink-0 text-right text-xs font-bold tabular-nums text-slate-600">{b.correct}/{b.total}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" onClick={() => setPhase('setup')} className="press inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white shadow-card hover:bg-rose-700">
                Làm đề khác
              </button>
              <button type="button" onClick={onBack} className="press inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Xong
              </button>
            </div>

            {/* Chữa đề chi tiết */}
            <details className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <summary className="cursor-pointer text-sm font-bold text-slate-900">Chữa đề chi tiết ({result.review.length} câu)</summary>
              <div className="mt-3 space-y-3">
                {result.review.map((r, i) => (
                  <div key={r.questionId} className={cn('rounded-xl border p-3 text-sm', r.correct ? 'border-emerald-200 bg-emerald-50/50' : 'border-rose-200 bg-rose-50/50')}>
                    <p className="text-xs font-semibold text-slate-500">Câu {i + 1} · {PART_META[r.part as 1]?.label ?? `Part ${r.part}`} · {r.correct ? 'Đúng' : `Bạn chọn ${r.chosen ?? '—'}, đáp án ${r.correctOption}`}</p>
                    <p className="mt-1 text-slate-800">
                      {LETTERS.filter((k) => r.options[k]).map((k) => (
                        <span key={k} className={cn('mr-3 inline-block', k === r.correctOption && 'font-bold text-emerald-700', k === r.chosen && !r.correct && 'font-bold text-rose-600 line-through')}>
                          {k}. {r.options[k]}
                        </span>
                      ))}
                    </p>
                    {r.explanation && <p className="mt-1 text-xs italic text-slate-600">{r.explanation}</p>}
                  </div>
                ))}
              </div>
            </details>
          </div>
        </main>
      </div>
    )
  }

  // ---------- Running ----------
  const renderOptions = (q: MockQuestion, audioOnly: boolean) => (
    <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
      {LETTERS.filter((k) => q.options[k]).map((k) => {
        const on = answers[q.id] === k
        return (
          <button
            key={k}
            type="button"
            onClick={() => pick(q.id, k)}
            className={cn(
              'press flex items-start gap-2 rounded-lg border px-3 py-2 text-left text-sm',
              on ? 'border-rose-500 bg-rose-50 ring-1 ring-rose-200' : 'border-slate-200 hover:border-rose-300 hover:bg-slate-50',
            )}
          >
            <span className={cn('grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs font-bold', on ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-500')}>{k}</span>
            {!audioOnly && <span className="text-slate-800">{q.options[k]}</span>}
          </button>
        )
      })}
    </div>
  )

  let qno = 0
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {header(
        <span className={cn('inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-bold tabular-nums', left <= 60 ? 'bg-rose-100 text-rose-700 animate-pulse-once' : 'bg-slate-100 text-slate-700')}>
          <Clock className="h-4 w-4" /> {fmt(left)}
        </span>,
      )}
      <main className="thin-scrollbar flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-card">
            <span className="font-semibold text-slate-700">Đã trả lời <b className="text-rose-600">{answered}</b>/{totalQ}</span>
            {supported && <SpeedControl />}
          </div>

          {units.map((u, ui) => {
            const isListen = (u.kind === 'q' ? u.q.part : u.p.part) <= 4
            const partNo = u.kind === 'q' ? u.q.part : u.p.part
            const prevPart = ui > 0 ? (units[ui - 1].kind === 'q' ? (units[ui - 1] as { q: MockQuestion }).q.part : (units[ui - 1] as { p: MockPassage }).p.part) : 0
            return (
              <div key={u.kind === 'q' ? `q${u.q.id}` : `p${u.p.id}`}>
                {partNo !== prevPart && (
                  <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">
                    {PART_META[partNo as 1]?.label ?? `Part ${partNo}`}
                  </p>
                )}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
                  {/* đề */}
                  {u.kind === 'q' && u.q.part === 1 && u.q.image && (
                    <img src={practiceImageUrl(u.q.image)} alt="Ảnh Part 1" loading="lazy" className="mb-2 max-h-72 w-full rounded-lg bg-slate-100 object-contain" />
                  )}
                  {u.kind === 'p' && (
                    <div className="mb-2">
                      {u.p.title && <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{u.p.title}</p>}
                      {!isListen && <div className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-800">{u.p.body}</div>}
                    </div>
                  )}
                  {isListen && supported && (
                    <button type="button" onClick={() => speakQ(u)} className="press mb-2 inline-flex items-center gap-1.5 rounded-lg bg-violet-100 px-3 py-1.5 text-sm font-semibold text-violet-700 hover:bg-violet-200">
                      <Volume2 className="h-4 w-4" /> Nghe
                    </button>
                  )}

                  {/* câu hỏi */}
                  {u.kind === 'q' ? (
                    <>
                      <p className="text-sm font-semibold text-slate-800">
                        <span className="text-rose-600">Câu {++qno}.</span>{' '}
                        {u.q.part === 5 ? u.q.stem : u.q.part === 2 ? 'Chọn câu đáp phù hợp' : 'Chọn câu tả đúng'}
                      </p>
                      {renderOptions(u.q, u.q.part === 1 || u.q.part === 2)}
                    </>
                  ) : (
                    <div className="space-y-3">
                      {u.p.questions.map((q) => (
                        <div key={q.id} className="border-t border-slate-100 pt-2 first:border-0 first:pt-0">
                          <p className="text-sm font-semibold text-slate-800">
                            <span className="text-rose-600">Câu {++qno}.</span>{' '}
                            {u.p.part === 6 ? `Chỗ trống (${q.blankNo})` : q.stem}
                          </p>
                          {renderOptions(q, false)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {err && <p className="text-center text-sm text-rose-600">{err}</p>}
          <button type="button" onClick={() => void submit()} disabled={busy} className="press inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white shadow-card hover:bg-rose-700 disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Nộp bài ({answered}/{totalQ})
          </button>
        </div>
      </main>
    </div>
  )
}
