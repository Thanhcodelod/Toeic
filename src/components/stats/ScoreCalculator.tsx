import { useState } from 'react'
import { Calculator } from 'lucide-react'
import { cn } from '../../lib/cn'
import { estimateScore } from '../../lib/toeicScore'

/** Quy đổi số câu đúng → điểm TOEIC L&R ước tính (0–990) + mức CEFR. */
export function ScoreCalculator() {
  const [lc, setLc] = useState(60)
  const [rc, setRc] = useState(60)
  const est = estimateScore(lc, rc)
  const band =
    est.total >= 785 ? 'text-emerald-600' : est.total >= 550 ? 'text-amber-600' : 'text-slate-700'

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <Calculator className="h-4 w-4 text-brand-600" /> Quy đổi điểm (ước tính)
      </h2>
      <p className="mt-1 text-xs text-slate-400">
        Nhập số câu đúng để ước tính điểm thang. Bảng quy đổi chỉ mang tính tham khảo.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {[
          { label: 'Listening — số câu đúng /100', val: lc, set: setLc },
          { label: 'Reading — số câu đúng /100', val: rc, set: setRc },
        ].map((f) => (
          <div key={f.label}>
            <label className="flex items-center justify-between text-xs font-medium text-slate-600">
              <span>{f.label}</span>
              <span className="tabular-nums font-bold text-slate-900">{f.val}</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={f.val}
              onChange={(e) => f.set(Number(e.target.value))}
              className="mt-1.5 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-600"
            />
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl bg-slate-50 p-4">
        <div>
          <p className={cn('text-4xl font-bold tabular-nums', band)}>{est.total}</p>
          <p className="text-xs text-slate-500">/ 990 điểm ước tính</p>
        </div>
        <div className="text-sm">
          <p className="text-slate-600">
            Nghe <b className="tabular-nums text-slate-900">{est.lc}</b> · Đọc{' '}
            <b className="tabular-nums text-slate-900">{est.rc}</b>
          </p>
          <p className="mt-1">
            <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-700">
              CEFR {est.cefr}
            </span>{' '}
            <span className="text-xs text-slate-500">{est.cefrNote}</span>
          </p>
        </div>
      </div>
    </section>
  )
}
