import { useEffect, useMemo, useRef, useState } from 'react'
import { StickyNote, Trash2 } from 'lucide-react'
import { cn } from '../../lib/cn'
import { deleteNote, getNotes, saveNote, type UserNote } from '../../lib/notesApi'

interface Props {
  text: string
  context: string
  className?: string
}

interface Seg {
  text: string
  mark: boolean
  note?: UserNote
}

// Bôi vàng những đoạn đã lưu ghi chú (khớp chuỗi con đầu tiên, bỏ qua chồng lấn).
function markSegments(text: string, notes: UserNote[]): Seg[] {
  const ranges: { start: number; end: number; note: UserNote }[] = []
  for (const n of notes) {
    const idx = text.indexOf(n.quote)
    if (idx >= 0 && n.quote.length > 0) ranges.push({ start: idx, end: idx + n.quote.length, note: n })
  }
  ranges.sort((a, b) => a.start - b.start)
  const out: Seg[] = []
  let pos = 0
  for (const r of ranges) {
    if (r.start < pos) continue
    if (r.start > pos) out.push({ text: text.slice(pos, r.start), mark: false })
    out.push({ text: text.slice(r.start, r.end), mark: true, note: r.note })
    pos = r.end
  }
  if (pos < text.length) out.push({ text: text.slice(pos), mark: false })
  if (out.length === 0) out.push({ text, mark: false })
  return out
}

/**
 * Bọc một đoạn văn bản đọc: người dùng bôi đen -> lưu ghi chú (ở DB).
 * Đoạn đã lưu được tô vàng; danh sách ghi chú hiện phía dưới để xem lại.
 */
export function NotedText({ text, context, className }: Props) {
  const [notes, setNotes] = useState<UserNote[]>([])
  const [sel, setSel] = useState<{ quote: string; x: number; y: number } | null>(null)
  const [composing, setComposing] = useState(false)
  const [draft, setDraft] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const popRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let alive = true
    getNotes(context).then((n) => alive && setNotes(n)).catch(() => {})
    return () => {
      alive = false
    }
  }, [context])

  const captureSelection = () => {
    const s = window.getSelection()
    if (!s || s.isCollapsed) return
    const q = s.toString().replace(/\s+/g, ' ').trim()
    const anchor = s.anchorNode
    if (q.length < 2 || !anchor || !containerRef.current?.contains(anchor)) return
    const rect = s.getRangeAt(0).getBoundingClientRect()
    setSel({ quote: q, x: rect.left + rect.width / 2, y: rect.top })
    setComposing(false)
    setDraft('')
  }

  // Đóng popover khi bấm ra ngoài (trừ lúc đang gõ ghi chú).
  useEffect(() => {
    if (!sel) return
    const onDown = (e: MouseEvent) => {
      if (composing) return
      if (popRef.current?.contains(e.target as Node)) return
      if (containerRef.current?.contains(e.target as Node)) return
      setSel(null)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [sel, composing])

  const save = async () => {
    if (!sel) return
    try {
      const n = await saveNote(context, sel.quote, draft.trim())
      setNotes((prev) => [...prev, n])
    } catch {
      /* im lặng — không chặn thao tác đọc */
    }
    setSel(null)
    setComposing(false)
    setDraft('')
    window.getSelection()?.removeAllRanges()
  }

  const remove = async (id: number) => {
    try {
      await deleteNote(id)
    } catch {
      /* bỏ qua */
    }
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }

  const segments = useMemo(() => markSegments(text, notes), [text, notes])

  return (
    <div>
      <div
        ref={containerRef}
        onMouseUp={captureSelection}
        onTouchEnd={() => window.setTimeout(captureSelection, 10)}
        className={cn('select-text', className)}
      >
        {segments.map((s, i) =>
          s.mark ? (
            <mark
              key={i}
              title={s.note?.note || 'Ghi chú'}
              className="rounded bg-amber-200/70 px-0.5 text-slate-900"
            >
              {s.text}
            </mark>
          ) : (
            <span key={i}>{s.text}</span>
          ),
        )}
      </div>

      {/* Popover nổi cạnh vùng bôi đen */}
      {sel && (
        <div
          ref={popRef}
          style={{ position: 'fixed', left: Math.min(Math.max(sel.x, 120), window.innerWidth - 120), top: Math.max(sel.y - 8, 8), transform: 'translate(-50%, -100%)', zIndex: 60 }}
          className="animate-fade-in"
        >
          {!composing ? (
            <button
              type="button"
              onClick={() => setComposing(true)}
              className="press inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-card-lg"
            >
              <StickyNote className="h-3.5 w-3.5" /> Ghi chú
            </button>
          ) : (
            <div className="w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-card-lg">
              <p className="mb-1 line-clamp-2 text-xs italic text-slate-500">“{sel.quote}”</p>
              <textarea
                autoFocus
                rows={2}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ghi chú (không bắt buộc)…"
                className="w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-amber-500"
              />
              <div className="mt-2 flex justify-end gap-1.5">
                <button type="button" onClick={() => setSel(null)} className="press rounded-lg px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100">
                  Huỷ
                </button>
                <button type="button" onClick={() => void save()} className="press rounded-lg bg-amber-500 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-600">
                  Lưu
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Danh sách ghi chú của bề mặt này */}
      {notes.length > 0 && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-700">
            <StickyNote className="h-3.5 w-3.5" /> Ghi chú của bạn ({notes.length})
          </p>
          <ul className="space-y-1.5">
            {notes.map((n) => (
              <li key={n.id} className="group flex items-start gap-2 text-sm">
                <span className="mt-0.5 h-3 w-1 shrink-0 rounded bg-amber-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate italic text-slate-600">“{n.quote}”</p>
                  {n.note && <p className="text-slate-800">{n.note}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => void remove(n.id)}
                  aria-label="Xoá ghi chú"
                  className="press mt-0.5 shrink-0 rounded p-1 text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-rose-100 hover:text-rose-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
