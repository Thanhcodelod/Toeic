import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Check, Lightbulb, Loader2, RotateCcw, Scissors, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import {
  ROLES,
  ROLE_LABEL,
  ROLE_STYLE,
  answerParse,
  getParseDrills,
  type ParseDrill as Drill,
  type ParseResult,
  type ParseRole,
} from '../../lib/readingApi'

/**
 * Phân tích thành phần câu. Câu đã được cắt sẵn thành các cụm; người học gán nhãn
 * cho từng cụm. Mục tiêu: nhìn ra lõi S-V-O trong vài giây mà KHÔNG cần dịch.
 */
export function ParseDrill() {
  const [drills, setDrills] = useState<Drill[] | null>(null)
  const [idx, setIdx] = useState(0)
  const [labels, setLabels] = useState<Record<number, ParseRole>>({})
  const [sel, setSel] = useState<number | null>(null)
  const [result, setResult] = useState<ParseResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setDrills(null)
    setError(null)
    try {
      const d = await getParseDrills(10)
      setDrills(d)
      setIdx(0)
      setLabels({})
      setSel(d[0]?.chunks[0]?.ord ?? null)
      setResult(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const drill = drills?.[idx]
  const done = useMemo(
    () => (drill ? drill.chunks.every((c) => labels[c.ord]) : false),
    [drill, labels],
  )

  const assign = (role: ParseRole) => {
    if (sel == null || result || !drill) return
    setLabels((p) => ({ ...p, [sel]: role }))
    // tự nhảy sang cụm chưa gán tiếp theo
    const rest = drill.chunks.filter((c) => c.ord !== sel && !labels[c.ord])
    setSel(rest[0]?.ord ?? null)
  }

  const submit = async () => {
    if (!drill || !done || busy) return
    setBusy(true)
    setError(null)
    try {
      setResult(await answerParse(drill.id, labels))
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
    const n = idx + 1
    setIdx(n)
    setLabels({})
    setSel(drills[n].chunks[0]?.ord ?? null)
    setResult(null)
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

  const roleOf = (ord: number): ParseRole | undefined =>
    result?.chunks.find((c) => c.ord === ord)?.role ?? labels[ord]
  const okOf = (ord: number) => result?.chunks.find((c) => c.ord === ord)?.ok

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-600">
          Câu {idx + 1}/{drills.length}
        </span>
        <span className="text-xs text-slate-400">
          Bấm vào một cụm rồi chọn vai trò của nó
        </span>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        {/* Câu, cắt sẵn thành các cụm */}
        <div className="flex flex-wrap items-start gap-x-2 gap-y-3 text-lg leading-relaxed">
          {drill.chunks.map((c) => {
            const r = roleOf(c.ord)
            const ok = okOf(c.ord)
            const active = sel === c.ord && !result
            return (
              <button
                key={c.ord}
                type="button"
                disabled={!!result}
                onClick={() => setSel(c.ord)}
                className={cn(
                  'press flex flex-col items-start rounded-lg border-b-2 px-1.5 py-0.5 text-left',
                  r ? ROLE_STYLE[r] : 'border-slate-200 hover:bg-slate-50',
                  active && 'scale-105 ring-2 ring-violet-400',
                  result && ok === false && 'animate-shake ring-2 ring-rose-400',
                  result && ok === true && 'ring-1 ring-emerald-300',
                )}
              >
                <span>{c.text}</span>
                {r && (
                  <span className="animate-pop mt-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide">
                    {result &&
                      (ok ? (
                        <Check className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <X className="h-3 w-3 text-rose-600" />
                      ))}
                    {ROLE_LABEL[r]}
                    {result && !ok && labels[c.ord] && (
                      <span className="font-normal normal-case text-rose-600">
                        (bạn chọn: {ROLE_LABEL[labels[c.ord]]})
                      </span>
                    )}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Bảng vai trò */}
        {!result && (
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ROLES.map((r) => (
              <button
                key={r}
                type="button"
                disabled={sel == null}
                onClick={() => assign(r)}
                className={cn(
                  'press rounded-xl border px-3 py-2 text-sm font-semibold disabled:opacity-40',
                  ROLE_STYLE[r],
                  'hover:brightness-95',
                )}
              >
                {ROLE_LABEL[r]}
              </button>
            ))}
          </div>
        )}

        {/* Kết quả */}
        {result && (
          <div className="stagger mt-6 space-y-3">
            <div
              className={cn(
                'rounded-xl p-4',
                result.pct >= 80 ? 'bg-emerald-50' : 'bg-amber-50',
              )}
            >
              <p className="text-sm font-bold text-slate-800">
                Đúng {result.correct}/{result.total} cụm ·{' '}
                <span
                  className={
                    result.pct >= 80 ? 'text-emerald-700' : 'text-amber-700'
                  }
                >
                  {result.pct}%
                </span>
              </p>
            </div>

            <div className="animate-pop-in rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-700">
                <Scissors className="h-3.5 w-3.5" /> Lõi câu (bỏ hết phần bổ trợ)
              </p>
              <p className="mt-1.5 text-lg font-semibold text-slate-900">
                {result.core}
              </p>
              <p className="mt-1 text-sm text-slate-600">{result.translation}</p>
            </div>

            {result.tip && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-700">
                  <Lightbulb className="h-3.5 w-3.5" /> Mẹo
                </p>
                <p className="mt-1.5 text-sm text-slate-700">{result.tip}</p>
              </div>
            )}
          </div>
        )}

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

        <button
          type="button"
          onClick={result ? next : () => void submit()}
          disabled={!result && (!done || busy)}
          className="press mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white shadow-card hover:bg-violet-700 disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {result ? (
            <>
              Câu tiếp theo <ArrowRight className="h-4 w-4" />
            </>
          ) : done ? (
            'Chấm bài'
          ) : (
            'Gán vai trò cho tất cả các cụm'
          )}
        </button>
      </div>
    </div>
  )
}
