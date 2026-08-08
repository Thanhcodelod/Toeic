import { Lightbulb } from 'lucide-react'
import type { Tip } from '../../../lib/courseApi'

export function TipsTab({ items }: { items: Tip[] }) {
  return (
    <div className="stagger space-y-3">
      {items.map((t, i) => (
        <div key={i} className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-card">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-amber-400 text-white">
            <Lightbulb className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900">{t.tip}</p>
            <p className="mt-0.5 text-sm leading-relaxed text-slate-700">{t.detail}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
