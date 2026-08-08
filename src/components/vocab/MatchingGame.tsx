import { useMemo, useState } from 'react'
import { ArrowLeft, RotateCcw, Trophy } from 'lucide-react'
import { cn } from '../../lib/cn'
import { answerVocab } from '../../lib/answersApi'
import type { VocabCard } from '../../data/types'

const PER_ROUND = 5
const shuffle = <T,>(a: T[]): T[] => {
  const x = [...a]
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[x[i], x[j]] = [x[j], x[i]]
  }
  return x
}

/** Trò chơi tìm cặp: nối TỪ ↔ NGHĨA. Đúng thì khoá cặp, ghi tiến trình ôn tập. */
export function MatchingGame({ cards, onExit }: { cards: VocabCard[]; onExit: () => void }) {
  const rounds = useMemo(() => {
    const pool = shuffle(cards).slice(0, 30)
    const r: VocabCard[][] = []
    for (let i = 0; i < pool.length; i += PER_ROUND) r.push(pool.slice(i, i + PER_ROUND))
    return r.filter((g) => g.length >= 2)
  }, [cards])

  const [round, setRound] = useState(0)
  const group = rounds[round] ?? []
  const words = useMemo(() => shuffle(group), [group])
  const meanings = useMemo(() => shuffle(group), [group])

  const [pickedWord, setPickedWord] = useState<string | null>(null)
  const [done, setDone] = useState<Set<string>>(new Set())
  const [wrong, setWrong] = useState<string | null>(null)

  const finishedAll = round >= rounds.length

  const tryMatch = (wordId: string, meaningId: string) => {
    if (wordId === meaningId) {
      const card = group.find((c) => c.id === wordId)
      if (card?.vocabItemId != null) answerVocab(card.vocabItemId, true).catch(() => {})
      const next = new Set(done).add(wordId)
      setDone(next)
      setPickedWord(null)
      if (next.size === group.length) {
        window.setTimeout(() => {
          setDone(new Set())
          setRound((r) => r + 1)
        }, 500)
      }
    } else {
      const card = group.find((c) => c.id === wordId)
      if (card?.vocabItemId != null) answerVocab(card.vocabItemId, false).catch(() => {})
      setWrong(meaningId)
      window.setTimeout(() => setWrong(null), 500)
      setPickedWord(null)
    }
  }

  if (finishedAll || rounds.length === 0) {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="flex flex-col items-center gap-2 bg-gradient-to-br from-violet-600 to-violet-800 p-8 text-white">
            <Trophy className="h-10 w-10 animate-trophy-in" />
            <p className="text-2xl font-bold">Hoàn thành!</p>
            <p className="text-sm text-violet-100">Bạn đã nối hết các cặp từ.</p>
          </div>
          <div className="flex justify-center gap-2 p-5">
            <button type="button" onClick={() => setRound(0)} className="press inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <RotateCcw className="h-4 w-4" /> Chơi lại
            </button>
            <button type="button" onClick={onExit} className="press rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-card hover:bg-violet-700">Xong</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex items-center justify-between text-sm">
        <button type="button" onClick={onExit} className="press inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium text-slate-600 hover:bg-slate-100">
          <ArrowLeft className="h-4 w-4" /> Thoát
        </button>
        <span className="font-semibold text-slate-500">Vòng {round + 1}/{rounds.length}</span>
      </div>
      <p className="mb-3 text-center text-sm text-slate-500">Bấm một TỪ rồi bấm NGHĨA tương ứng.</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {words.map((c) => {
            const matched = done.has(c.id)
            const on = pickedWord === c.id
            return (
              <button
                key={c.id}
                type="button"
                disabled={matched}
                onClick={() => setPickedWord(c.id)}
                className={cn('press w-full rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-colors',
                  matched ? 'border-emerald-300 bg-emerald-50 text-emerald-700 opacity-60' : on ? 'border-violet-500 bg-violet-50 ring-1 ring-violet-200' : 'border-slate-200 bg-white hover:border-violet-300')}
              >
                {c.word}
              </button>
            )
          })}
        </div>
        <div className="space-y-2">
          {meanings.map((c) => {
            const matched = done.has(c.id)
            return (
              <button
                key={c.id}
                type="button"
                disabled={matched || !pickedWord}
                onClick={() => pickedWord && tryMatch(pickedWord, c.id)}
                className={cn('press w-full rounded-xl border px-3 py-2.5 text-left text-sm transition-colors',
                  matched ? 'border-emerald-300 bg-emerald-50 text-emerald-700 opacity-60' : wrong === c.id ? 'animate-shake border-rose-400 bg-rose-50' : 'border-slate-200 bg-white hover:border-violet-300 disabled:opacity-50')}
              >
                {c.meaning}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
