import { useEffect, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
// The pdf.js worker is served statically from public/pdf.worker.min.mjs, copied
// from pdfjs-dist@4.8.69 — the SAME version react-pdf's pdfjs uses — so the API
// and Worker versions always match. A fixed same-origin path sidesteps the Vite
// dep-optimization/cache pitfalls that served a stale 4.4.168 worker. Rendered to
// <canvas>, so it also ignores the browser's "always download PDFs" setting.
// NOTE: re-copy public/pdf.worker.min.mjs if react-pdf/pdfjs-dist is upgraded.
pdfjs.GlobalWorkerOptions.workerSrc = `${import.meta.env.BASE_URL}pdf.worker.min.mjs`

interface ExamPdfProps {
  url: string
  label?: string
}

export function ExamPdf({ url, label = 'Đề thi' }: ExamPdfProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [baseWidth, setBaseWidth] = useState(760)
  const [zoom, setZoom] = useState(1)
  const [numPages, setNumPages] = useState(0)
  const [page, setPage] = useState(1)
  const [error, setError] = useState(false)

  // Reset when the source changes (e.g. switching LC <-> RC).
  useEffect(() => {
    setPage(1)
    setNumPages(0)
    setError(false)
    setZoom(1)
  }, [url])

  // Fit the page width to the container.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setBaseWidth(Math.max(280, el.clientWidth - 24))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const pageWidth = Math.round(baseWidth * zoom)

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2.5">
        <span className="truncate text-sm font-semibold text-slate-700">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          {!error && (
            <>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
                className="grid h-7 w-7 place-items-center rounded-md text-slate-500 hover:bg-slate-100"
                aria-label="Thu nhỏ"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-xs tabular-nums text-slate-500">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
                className="grid h-7 w-7 place-items-center rounded-md text-slate-500 hover:bg-slate-100"
                aria-label="Phóng to"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              {numPages > 0 && (
                <div className="ml-1 flex items-center gap-1 border-l border-slate-200 pl-2 text-xs text-slate-500">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="grid h-7 w-7 place-items-center rounded-md hover:bg-slate-100 disabled:opacity-30"
                    aria-label="Trang trước"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="tabular-nums">
                    {page}/{numPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(numPages, p + 1))}
                    disabled={page >= numPages}
                    className="grid h-7 w-7 place-items-center rounded-md hover:bg-slate-100 disabled:opacity-30"
                    aria-label="Trang sau"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="ml-1 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Tab mới
          </a>
        </div>
      </div>

      <div
        ref={containerRef}
        className="thin-scrollbar flex-1 overflow-auto bg-slate-100 p-3"
      >
        {error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <AlertTriangle className="h-9 w-9 text-amber-500" />
            <p className="text-sm text-slate-600">
              Không tải được đề. Kiểm tra kết nối mạng rồi thử lại.
            </p>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Mở đề trong tab mới
            </a>
          </div>
        ) : (
          <Document
            file={url}
            onLoadSuccess={({ numPages: n }) => setNumPages(n)}
            onLoadError={() => setError(true)}
            loading={
              <div className="flex items-center justify-center gap-2 py-20 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" /> Đang tải đề…
              </div>
            }
            className="flex justify-center"
          >
            <Page
              pageNumber={page}
              width={pageWidth}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="shadow-card"
            />
          </Document>
        )}
      </div>
    </div>
  )
}
