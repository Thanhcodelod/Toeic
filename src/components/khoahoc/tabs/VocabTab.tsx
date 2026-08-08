import { useState } from 'react'
import { BookmarkCheck, BookmarkPlus, Volume2 } from 'lucide-react'
import { cn } from '../../../lib/cn'
import { useSpeak } from '../../../hooks/useSpeak'
import { saveWord } from '../../../lib/savedWordsApi'
import type { CourseVocab } from '../../../lib/courseApi'

export function VocabTab({ items }: { items: CourseVocab[] }) {
  const { speak, supported } = useSpeak()
  const [saved, setSaved] = useState<Set<string>>(new Set())

  const save = async (w: CourseVocab) => {
    setSaved((s) => new Set(s).add(w.word))
    try {
      await saveWord(w.word, w.example)
    } catch {
      /* bỏ qua */
    }
  }

  return (
    <div className="stagger space-y-2.5">
      {items.map((w, i) => {
        const isSaved = saved.has(w.word)
        return (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
            <div className="flex items-center gap-2">
              <p className="text-base font-bold text-slate-900">{w.word}</p>
              {w.wordForm && (
                <span className="rounded-md bg-sky-100 px-1.5 py-0.5 text-[11px] font-semibold text-sky-700">{w.wordForm}</span>
              )}
              {w.ipa && <span className="text-xs text-slate-400">{w.ipa}</span>}
              {supported && (
                <button
                  type="button"
                  onClick={() => speak(w.word)}
                  aria-label="Phát âm"
                  className="press ml-auto grid h-8 w-8 place-items-center rounded-lg bg-violet-100 text-violet-700 hover:bg-violet-200"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => void save(w)}
                aria-label="Lưu vào sổ tay"
                className={cn(
                  'press grid h-8 w-8 place-items-center rounded-lg',
                  isSaved ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                )}
              >
                {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1 text-sm text-slate-700">{w.meaning}</p>
            {w.example && (
              <p className="mt-2 border-l-2 border-slate-200 pl-3 text-sm italic text-slate-600">
                {w.example}
                {w.exampleVi && <span className="mt-0.5 block not-italic text-slate-400">{w.exampleVi}</span>}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
