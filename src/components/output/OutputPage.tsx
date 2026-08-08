import { useState } from 'react'
import { ArrowLeft, Mic, PenLine } from 'lucide-react'
import { cn } from '../../lib/cn'
import { WritingTab } from './WritingTab'
import { SpeakingTab } from './SpeakingTab'

type Tab = 'writing' | 'speaking'

export function OutputPage({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<Tab>('writing')

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <button type="button" onClick={onBack} className="press mb-4 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
        <ArrowLeft className="h-4 w-4" /> Về lộ trình
      </button>

      <header className="mb-5 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Nói &amp; Viết</h1>
        <p className="mt-1 text-sm text-slate-500">Luyện kỹ năng đầu ra: viết được AI chấm &amp; chữa, nói theo câu mẫu.</p>
      </header>

      <div className="mx-auto mb-6 flex max-w-xs gap-1 rounded-2xl bg-slate-100 p-1">
        {([['writing', 'Viết', PenLine], ['speaking', 'Nói', Mic]] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'press flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold transition',
              tab === id ? 'bg-white text-slate-900 shadow-card' : 'text-slate-500 hover:text-slate-700',
            )}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      <div className="animate-fade-slide-up" key={tab}>
        {tab === 'writing' ? <WritingTab /> : <SpeakingTab />}
      </div>
    </div>
  )
}
