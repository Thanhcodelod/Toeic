import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, RotateCw, Shuffle } from 'lucide-react'
import { cn } from '../../../lib/cn'
import { Flashcard } from './Flashcard'
import type { VocabCard } from '../../../data/types'

function shuffleArray<T>(input: T[]): T[] {
  const arr = [...input]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

interface FlashcardDeckProps {
  cards: VocabCard[]
}

export function FlashcardDeck({ cards: initialCards }: FlashcardDeckProps) {
  const [cards, setCards] = useState<VocabCard[]>(initialCards)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const total = cards.length

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(i + 1, total - 1))
    setFlipped(false)
  }, [total])

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0))
    setFlipped(false)
  }, [])

  const shuffle = useCallback(() => {
    setCards((prev) => shuffleArray(prev))
    setIndex(0)
    setFlipped(false)
  }, [])

  const restart = useCallback(() => {
    setCards(initialCards)
    setIndex(0)
    setFlipped(false)
  }, [initialCards])

  // Keyboard navigation (← / →).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev])

  const card = cards[index]
  const atStart = index === 0
  const atEnd = index === total - 1

  return (
    <div className="mx-auto max-w-2xl">
      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-600">
          Thẻ {index + 1}/{total}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={shuffle}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <Shuffle className="h-4 w-4" />
            Xáo trộn
          </button>
          <button
            type="button"
            onClick={restart}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <RotateCw className="h-4 w-4" />
            Về đầu
          </button>
        </div>
      </div>

      {/* Card */}
      <Flashcard
        key={card.id}
        card={card}
        flipped={flipped}
        onFlip={() => setFlipped((f) => !f)}
      />

      {/* Controls */}
      <div className="mt-6 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={goPrev}
          disabled={atStart}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-card enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
          Trước
        </button>

        {/* Progress dots */}
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {cards.map((c, i) => (
            <button
              key={c.id}
              type="button"
              aria-label={`Đến thẻ ${i + 1}`}
              onClick={() => {
                setIndex(i)
                setFlipped(false)
              }}
              className={cn(
                'h-2 rounded-full transition-all',
                i === index
                  ? 'w-5 bg-violet-500'
                  : 'w-2 bg-slate-300 hover:bg-slate-400',
              )}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={goNext}
          disabled={atEnd}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-card enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Sau
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-slate-400">
        Mẹo: dùng phím ← / → để chuyển thẻ, phím cách để lật thẻ.
      </p>
    </div>
  )
}
