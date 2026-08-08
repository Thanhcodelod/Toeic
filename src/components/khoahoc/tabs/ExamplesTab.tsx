import { Volume2 } from 'lucide-react'
import { useSpeak } from '../../../hooks/useSpeak'
import type { Example } from '../../../lib/courseApi'

export function ExamplesTab({ items }: { items: Example[] }) {
  const { speak, supported } = useSpeak()
  return (
    <div className="stagger space-y-3">
      {items.map((e, i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
          <div className="flex items-start gap-2">
            <p className="flex-1 text-[15px] font-semibold leading-relaxed text-slate-900">{e.en}</p>
            {supported && (
              <button
                type="button"
                onClick={() => speak(e.en)}
                aria-label="Nghe câu"
                className="press grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-violet-100 text-violet-700 hover:bg-violet-200"
              >
                <Volume2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">{e.vi}</p>
          <p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
            <span className="font-semibold text-slate-900">Phân tích: </span>
            {e.analysis}
          </p>
        </div>
      ))}
    </div>
  )
}
