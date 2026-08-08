import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, BookmarkPlus, Check, Loader2, Search, Volume2 } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useSpeak } from '../../hooks/useSpeak'
import { searchVocab, setVocabKnown, type VocabRef } from '../../lib/vocabExtrasApi'
import { saveWord } from '../../lib/savedWordsApi'

const FORM: Record<string, string> = {
  n: 'noun', v: 'verb', adj: 'adjective', adv: 'adverb', prep: 'preposition', conj: 'conjunction', phr: 'phrasal',
}

/** Tra cứu / duyệt kho 837 từ TOEIC 650+: tìm, nghe, lưu sổ tay, đánh dấu đã biết. */
export function VocabReference({ onBack }: { onBack: () => void }) {
  const { speak, supported } = useSpeak()
  const [q, setQ] = useState('')
  const [items, setItems] = useState<VocabRef[] | null>(null)
  const [flag, setFlag] = useState<Record<number, 'saved' | 'known'>>({})
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const run = (query: string) => {
    searchVocab(query, 80).then(setItems).catch(() => setItems([]))
  }
  useEffect(() => {
    run('')
  }, [])
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => run(q), 300)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [q])

  const save = async (it: VocabRef) => {
    try {
      await saveWord(it.word, it.example ?? undefined)
      setFlag((f) => ({ ...f, [it.id]: 'saved' }))
    } catch { /* im lặng */ }
  }
  const known = async (it: VocabRef) => {
    try {
      await setVocabKnown(it.id)
      setFlag((f) => ({ ...f, [it.id]: 'known' }))
    } catch { /* im lặng */ }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <button type="button" onClick={onBack} className="press mb-3 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </button>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo từ tiếng Anh hoặc nghĩa tiếng Việt…"
          className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-violet-500"
          autoFocus
        />
      </div>

      {items === null ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /> Đang tải…</div>
      ) : items.length === 0 ? (
        <p className="py-16 text-center text-sm text-slate-500">Không tìm thấy từ nào.</p>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-card">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900">
                    {it.word} <span className="text-xs font-normal italic text-slate-400">({FORM[it.wordForm] ?? it.wordForm})</span>
                    {it.level >= 5 && <span className="ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">đã thuộc</span>}
                  </p>
                  <p className="text-xs text-slate-400">{it.ipa}</p>
                  <p className="mt-0.5 text-sm text-violet-800">{it.meaning}</p>
                  {it.example && <p className="mt-1 text-xs italic text-slate-500">“{it.example}”</p>}
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  {supported && (
                    <button type="button" onClick={() => speak(it.word)} aria-label="Nghe" className="press grid h-8 w-8 place-items-center rounded-full bg-violet-100 text-violet-700 hover:bg-violet-200">
                      <Volume2 className="h-4 w-4" />
                    </button>
                  )}
                  <button type="button" onClick={() => save(it)} aria-label="Lưu sổ tay"
                    className={cn('press grid h-8 w-8 place-items-center rounded-full', flag[it.id] === 'saved' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 hover:bg-slate-100')}>
                    {flag[it.id] === 'saved' ? <Check className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {flag[it.id] !== 'known' && it.level < 5 && (
                <button type="button" onClick={() => known(it)} className="press mt-1.5 text-xs font-medium text-slate-400 hover:text-emerald-600">
                  Đánh dấu đã thuộc — bỏ qua khi học
                </button>
              )}
              {flag[it.id] === 'known' && <p className="mt-1.5 text-xs font-medium text-emerald-600">✓ Đã đánh dấu thuộc</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
