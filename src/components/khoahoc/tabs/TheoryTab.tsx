import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function TheoryTab({ markdown }: { markdown: string }) {
  return (
    <article className="animate-fade-in rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
      <div className="markdown-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </div>
    </article>
  )
}
