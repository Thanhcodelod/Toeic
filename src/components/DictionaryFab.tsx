import { useState } from 'react'
import { BookA, BookmarkPlus, Check, Loader2, Search, Volume2, X } from 'lucide-react'
import { cn } from '../lib/cn'
import { useSpeak } from '../hooks/useSpeak'
import { lookupWord, type WordLookup } from '../lib/dictionaryApi'
import { saveWord } from '../lib/savedWordsApi'

/** Nút tra từ điển NỔI — bấm để tra nhanh nghĩa bất kỳ từ tiếng Anh nào. */
export function DictionaryFab() {
  const { speak, supported } = useSpeak()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [res, setRes] = useState<WordLookup | null>(null)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const lookup = async () => {
    const w = q.trim()
    if (!w || busy) return
    setBusy(true)
    setErr(null)
    setRes(null)
    setSaved(false)
    try {
      setRes(await lookupWord(w))
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Tra từ điển"
          className="press fixed bottom-5 right-5 z-40 grid h-12 w-12 place-items-center rounded-full bg-brand-600 text-white shadow-card-lg hover:bg-brand-700"
        >
          <BookA className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-40 w-[min(92vw,360px)] animate-fade-slide-up rounded-2xl border border-slate-200 bg-white p-4 shadow-card-xl">
          <div className="mb-2 flex items-center gap-2">
            <BookA className="h-4 w-4 text-brand-600" />
            <span className="text-sm font-bold text-slate-900">Tra từ</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Đóng" className="press ml-auto grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              autoFocus
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void lookup()}
              placeholder="Nhập từ tiếng Anh…"
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-16 text-sm outline-none focus:border-brand-500"
            />
            <button type="button" onClick={() => void lookup()} disabled={busy}
              className="press absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-60">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Tra'}
            </button>
          </div>

          {err && <p className="mt-2 text-xs text-rose-600">{err}</p>}

          {res && (
            <div className="mt-3 rounded-xl bg-slate-50 p-3">
              <div className="flex items-center gap-2">
                <p className="font-bold text-slate-900">{res.word}</p>
                {res.ipa && <span className="text-xs text-slate-400">{res.ipa}</span>}
                {supported && (
                  <button type="button" onClick={() => speak(res.word)} aria-label="Nghe" className="press ml-auto grid h-7 w-7 place-items-center rounded-full bg-violet-100 text-violet-700 hover:bg-violet-200">
                    <Volume2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="mt-1 text-sm text-violet-800">
                {res.wordForm && <span className="italic text-slate-400">({res.wordForm}) </span>}
                {res.meaning}
              </p>
              {res.example && <p className="mt-1 text-xs italic text-slate-500">“{res.example}”</p>}
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => saveWord(res.word, res.example ?? undefined).then(() => setSaved(true)).catch(() => {})}
                  className={cn('press inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold', saved ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700 hover:bg-violet-200')}
                >
                  {saved ? <Check className="h-3.5 w-3.5" /> : <BookmarkPlus className="h-3.5 w-3.5" />}
                  {saved ? 'Đã lưu sổ tay' : 'Lưu sổ tay'}
                </button>
                <span className="text-[10px] text-slate-400">{res.source === 'bank' ? 'từ kho của app' : 'AI dịch'}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
