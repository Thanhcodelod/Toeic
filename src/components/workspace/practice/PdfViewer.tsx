import { ExternalLink, FileText } from 'lucide-react'

interface PdfViewerProps {
  url: string
  title?: string
}

/**
 * Embeds a PDF via <object> with an <iframe> fallback and a final
 * "open in new tab" fallback for browsers that refuse inline rendering.
 * Structured so it can be swapped for react-pdf later without touching callers.
 */
export function PdfViewer({ url, title = 'Đề thi (PDF)' }: PdfViewerProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <FileText className="h-4 w-4 text-rose-500" />
          {title}
        </span>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Mở tab mới
        </a>
      </div>

      <div className="min-h-[420px] flex-1 bg-slate-100">
        <object data={url} type="application/pdf" className="h-full w-full">
          <iframe src={url} title={title} className="h-full w-full border-0" />
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <FileText className="h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-500">
              Trình duyệt không hiển thị được PDF trực tiếp.
            </p>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Tải / mở đề thi
            </a>
          </div>
        </object>
      </div>
    </div>
  )
}
