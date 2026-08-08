import { useEffect, useState } from 'react'
import { BookMarked, Loader2, Trash2, Volume2 } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useSpeak } from '../../hooks/useSpeak'
import { deleteSavedWord, getSavedWords, type SavedWord } from '../../lib/savedWordsApi'

/** Sổ tay từ đã lưu khi nghe (bấm chọn từ trong transcript). Lật thẻ để ôn. */
export function SavedWordsPanel() {
  const { speak, supported } = useSpeak()
  const [words, setWords] = useState<SavedWord[] | null>(null)
  const [open, setOpen] = useState<Set<number>>(new Set())

  const load = async () => {
    try {
      setWords(await getSavedWords())
    } catch {
      setWords([])
    }
  }
  useEffect(() => {
    void load()
  }, [])

  const remove = async (id: number) => {
    setWords((w) => (w ? w.filter((x) => x.id !== id) : w))
    try {
      await deleteSavedWord(id)
    } catch {
      void load()
    }
  }
  const toggle = (id: number) =>
    setOpen((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })

  if (words === null)
    return (
      <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Đang tải sổ tay…
      </div>
    )
  if (words.length === 0)
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-center text-sm text-slate-500">
        <BookMarked className="mx-auto mb-2 h-6 w-6 text-slate-300" />
        Chưa có từ nào. Khi nghe bài (Part 3/4), bật “Xem lời thoại” rồi bấm vào một từ để lưu vào đây ôn sau.
      </div>
    )

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <BookMarked className="h-4 w-4 text-violet-600" />
        <h3 className="text-sm font-bold text-slate-900">
          Sổ tay từ đã lưu <span className="text-slate-400">({words.length})</span>
        </h3>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {words.map((w) => {
          const isOpen = open.has(w.id)
          return (
            <div key={w.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-card">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggle(w.id)}
                  className="press min-w-0 flex-1 text-left"
                >
                  <span className="font-bold text-slate-900">{w.word}</span>
                  {w.matched && w.ipa && (
                    <span className="ml-1.5 text-xs text-slate-400">{w.ipa}</span>
                  )}
                  {w.matched && (
                    <span className="ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                      có trong kho
                    </span>
                  )}
                </button>
                {supported && (
                  <button
                    type="button"
                    onClick={() => speak(w.word)}
                    aria-label="Nghe phát âm"
                    className="press grid h-8 w-8 shrink-0 place-items-center rounded-full bg-violet-100 text-violet-700 hover:bg-violet-200"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(w.id)}
                  aria-label="Xoá từ"
                  className="press grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {isOpen && (
                <div className="mt-2 animate-fade-slide-down border-t border-slate-100 pt-2 text-sm">
                  {w.matched ? (
                    <>
                      <p className="text-slate-800">
                        {w.wordForm && <span className="italic text-slate-400">({w.wordForm}) </span>}
                        {w.meaning}
                      </p>
                      {w.example && <p className="mt-1 text-xs italic text-slate-500">“{w.example}”</p>}
                    </>
                  ) : (
                    <p className="text-xs text-slate-500">
                      <span className="font-semibold text-slate-600">Ngữ cảnh:</span>{' '}
                      {w.context ? `“${w.context}”` : 'không có'}
                    </p>
                  )}
                </div>
              )}
              {!isOpen && (
                <button
                  type="button"
                  onClick={() => toggle(w.id)}
                  className={cn('mt-1 text-xs text-violet-500 hover:text-violet-700')}
                >
                  Xem nghĩa / ngữ cảnh
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
