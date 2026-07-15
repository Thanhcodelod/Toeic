import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Sparkles } from 'lucide-react'
import { Callout } from './Callout'
import type { GrammarContent } from '../../../data/types'

interface TheoryTabProps {
  content: GrammarContent
}

export function TheoryTab({ content }: TheoryTabProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      {/* Theory */}
      <article className="animate-fade-in rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
        <div className="markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content.theoryMarkdown}
          </ReactMarkdown>
        </div>
      </article>

      {/* Tips sidebar */}
      {content.tips.length > 0 && (
        <aside className="space-y-3 lg:sticky lg:top-4 lg:self-start">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Lưu ý &amp; mẹo TOEIC
          </div>
          <div className="stagger space-y-3">
            {content.tips.map((tip, index) => (
              <Callout key={index} text={tip} />
            ))}
          </div>
        </aside>
      )}
    </div>
  )
}
