import type { KeyboardEvent } from 'react'
import { Volume2 } from 'lucide-react'
import { cn } from '../../../lib/cn'
import { useSpeak } from '../../../hooks/useSpeak'
import type { VocabCard, WordForm } from '../../../data/types'

const WORD_FORM_LABEL: Record<WordForm, string> = {
  n: 'danh từ',
  v: 'động từ',
  adj: 'tính từ',
  adv: 'trạng từ',
  prep: 'giới từ',
  conj: 'liên từ',
  phr: 'cụm từ',
}

interface FlashcardProps {
  card: VocabCard
  flipped: boolean
  onFlip: () => void
}

export function Flashcard({ card, flipped, onFlip }: FlashcardProps) {
  const { speak, supported } = useSpeak()

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onFlip()
    }
  }

  const SpeakButton = ({ text, label }: { text: string; label: string }) =>
    supported ? (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          speak(text)
        }}
        aria-label={label}
        className="press inline-grid h-9 w-9 place-items-center rounded-full bg-violet-100 text-violet-700 transition-colors hover:bg-violet-200"
      >
        <Volume2 className="h-4 w-4" />
      </button>
    ) : null

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onFlip}
      onKeyDown={handleKeyDown}
      aria-pressed={flipped}
      aria-label={
        flipped
          ? `Nghĩa của từ ${card.word}. Nhấn để lật lại.`
          : `Từ ${card.word}. Nhấn để xem nghĩa.`
      }
      className="card-3d animate-fade-slide-left block h-80 w-full cursor-pointer rounded-3xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
    >
      <div className={cn('card-3d-inner', flipped && 'is-flipped')}>
        {/* Front */}
        <div
          className="card-face items-center justify-center rounded-3xl border border-slate-200 bg-white p-8 shadow-card-lg"
          aria-hidden={flipped}
        >
          <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
            {card.wordForm}. · {WORD_FORM_LABEL[card.wordForm]}
          </span>
          <div className="mt-5 flex items-center gap-3">
            <h3 className="text-center text-4xl font-bold text-slate-900 sm:text-5xl">
              {card.word}
            </h3>
            <SpeakButton text={card.word} label={`Nghe phát âm từ ${card.word}`} />
          </div>
          <p className="mt-3 text-lg text-slate-500">{card.ipa}</p>
          <span className="absolute bottom-5 text-xs font-medium text-slate-400">
            Nhấn thẻ để xem nghĩa · loa để nghe phát âm
          </span>
        </div>

        {/* Back */}
        <div
          className="card-face card-face--back items-center justify-center rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-8 shadow-card-lg"
          aria-hidden={!flipped}
        >
          <p className="text-center text-2xl font-bold text-violet-900">
            {card.meaning}
          </p>
          <div className="mt-5 w-full max-w-md space-y-1.5 border-t border-violet-200 pt-4">
            <p className="flex items-center justify-center gap-2 text-center text-[15px] font-medium italic text-slate-700">
              “{card.example}”
              <SpeakButton
                text={card.example}
                label="Nghe câu ví dụ"
              />
            </p>
            <p className="text-center text-sm text-slate-500">
              {card.exampleTranslation}
            </p>
          </div>
          <span className="absolute bottom-5 text-xs font-medium text-violet-400">
            Nhấn để lật lại
          </span>
        </div>
      </div>
    </div>
  )
}
