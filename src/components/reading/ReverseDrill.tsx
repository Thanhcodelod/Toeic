import { useEffect, useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  Check,
  Eye,
  EyeOff,
  Loader2,
  RotateCcw,
  X,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import {
  answerReverse,
  getReverseDrills,
  type ReverseDrill as Drill,
  type ReverseResult,
} from '../../lib/readingApi'

type Step = 'vi' | 'en' | 'done'

/**
 * Dịch ngược:
 *   B1. Đọc câu tiếng Anh CHUẨN, tự dịch sang tiếng Việt văn phong công sở.
 *   B2. GIẤU câu tiếng Anh đi, chỉ nhìn tiếng Việt và viết lại tiếng Anh.
 *   B3. Server chấm: các từ khoá CẤU TRÚC bắt buộc + độ trùng khớp với câu gốc.
 */
export function ReverseDrill() {
  const [drills, setDrills] = useState<Drill[] | null>(null)
  const [idx, setIdx] = useState(0)
  const [step, setStep] = useState<Step>('vi')
  const [vi, setVi] = useState('')
  const [showRef, setShowRef] = useState(false)
  const [en, setEn] = useState('')
  const [result, setResult] = useState<ReverseResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setDrills(null)
    setError(null)
    try {
      const d = await getReverseDrills(10)
      setDrills(d)
      reset(0)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const reset = (i: number) => {
    setIdx(i)
    setStep('vi')
    setVi('')
    setShowRef(false)
    setEn('')
    setResult(null)
  }

  useEffect(() => {
    void load()
  }, [])

  const drill = drills?.[idx]

  const submit = async () => {
    if (!drill || busy || !en.trim()) return
    setBusy(true)
    setError(null)
    try {
      setResult(await answerReverse(drill.id, en))
      setStep('done')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const next = () => {
    if (!drills) return
    if (idx + 1 >= drills.length) {
      void load()
      return
    }
    reset(idx + 1)
  }

  if (error && !drills) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="text-sm font-semibold text-rose-800">{error}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="press mt-3 inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white"
        >
          <RotateCcw className="h-4 w-4" /> Thử lại
        </button>
      </div>
    )
  }
  if (!drills) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" /> Đang tải câu…
      </div>
    )
  }
  if (!drill) {
    return (
      <p className="py-16 text-center text-sm text-slate-500">
        Chưa có câu nào. Nội dung sẽ sớm được bổ sung.
      </p>
    )
  }

  const STEPS: { id: Step; label: string }[] = [
    { id: 'vi', label: '1. Dịch sang tiếng Việt' },
    { id: 'en', label: '2. Viết lại tiếng Anh' },
    { id: 'done', label: '3. Đối chiếu' },
  ]

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-600">
          Câu {idx + 1}/{drills.length}
        </span>
        <div className="flex gap-1.5">
          {STEPS.map((s) => (
            <span
              key={s.id}
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] font-semibold transition duration-250 ease-spring',
                step === s.id
                  ? 'scale-105 bg-violet-600 text-white'
                  : 'bg-slate-100 text-slate-400',
              )}
            >
              {s.label}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        {/* Mỗi bước là một lần trượt vào — key đổi theo bước để phát lại hiệu ứng */}
        <div key={step} className="animate-fade-slide-up">
        {/* ---------- B1: câu tiếng Anh hiện ra, dịch sang tiếng Việt ---------- */}
        {step === 'vi' && (
          <>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Câu tiếng Anh chuẩn
            </p>
            <p className="mt-1.5 text-xl font-semibold leading-relaxed text-slate-900">
              {drill.english}
            </p>

            <label className="mt-5 block text-sm font-semibold text-slate-700">
              Dịch sang tiếng Việt (văn phong công sở)
            </label>
            <textarea
              value={vi}
              rows={3}
              autoFocus
              onChange={(e) => setVi(e.target.value)}
              placeholder="Viết bản dịch của bạn…"
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500"
            />

            {showRef && (
              <div className="animate-fade-slide-down mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                  Bản dịch mẫu
                </p>
                <p className="mt-1 text-slate-800">{drill.vietnamese}</p>
              </div>
            )}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowRef((s) => !s)}
                disabled={!vi.trim()}
                className="press inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {showRef ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showRef ? 'Ẩn bản dịch mẫu' : 'Đối chiếu bản dịch mẫu'}
              </button>
              <button
                type="button"
                onClick={() => setStep('en')}
                disabled={!vi.trim()}
                className="press inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white shadow-card hover:bg-violet-700 disabled:opacity-50"
              >
                Giấu câu Anh, viết lại <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}

        {/* ---------- B2: câu tiếng Anh bị GIẤU, viết lại từ tiếng Việt -------- */}
        {step === 'en' && (
          <>
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-center text-sm text-slate-400">
              <EyeOff className="mx-auto h-4 w-4" />
              Câu tiếng Anh đã bị giấu — đừng nhìn lại
            </div>

            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-400">
              Tiếng Việt
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {drill.vietnamese}
            </p>
            <p className="mt-1 text-sm italic text-slate-400">
              (bản dịch của bạn: {vi})
            </p>

            <label className="mt-5 block text-sm font-semibold text-slate-700">
              Viết lại câu tiếng Anh
            </label>
            <textarea
              value={en}
              rows={3}
              autoFocus
              onChange={(e) => setEn(e.target.value)}
              placeholder="Write the English sentence…"
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500"
            />

            {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

            <button
              type="button"
              onClick={() => void submit()}
              disabled={!en.trim() || busy}
              className="press mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white shadow-card hover:bg-violet-700 disabled:opacity-50"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Chấm bài
            </button>
          </>
        )}

        {/* ---------- B3: đối chiếu ---------- */}
        {step === 'done' && result && (
          <>
            <div
              className={cn(
                'rounded-xl p-4 text-center',
                result.pct >= 80
                  ? 'bg-emerald-50'
                  : result.pct >= 50
                    ? 'bg-amber-50'
                    : 'bg-rose-50',
              )}
            >
              <p className="animate-pop text-3xl font-bold tabular-nums text-slate-900">
                {result.pct}%
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Từ khoá cấu trúc {result.keywordsHit}/{result.keywordsTotal} · trùng
                khớp từ vựng {result.overlapPct}%
              </p>
            </div>

            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Từ khoá cấu trúc bắt buộc
              </p>
              <div className="stagger mt-1.5 flex flex-wrap gap-1.5">
                {result.keywords.map((k) => (
                  <span
                    key={k.kw}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                      k.ok
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800',
                    )}
                  >
                    {k.ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    {k.kw}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Bạn viết
                </p>
                <p className="mt-0.5 text-slate-800">{en}</p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                  Câu gốc
                </p>
                <p className="mt-0.5 font-semibold text-slate-900">{result.english}</p>
              </div>
            </div>

            {(result.structure || result.grammarPoint) && (
              <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-4">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-violet-700">
                  <BookOpen className="h-3.5 w-3.5" /> Cấu trúc
                </p>
                {result.structure && (
                  <p className="mt-1 font-mono text-sm text-slate-800">
                    {result.structure}
                  </p>
                )}
                {result.grammarPoint && (
                  <p className="mt-1 text-sm text-slate-600">{result.grammarPoint}</p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={next}
              className="press mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white shadow-card hover:bg-violet-700"
            >
              Câu tiếp theo <ArrowRight className="h-4 w-4" />
            </button>
          </>
        )}
        </div>
      </div>
    </div>
  )
}
