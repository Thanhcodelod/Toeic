import { useState } from 'react'
import { Brain, Layers } from 'lucide-react'
import { cn } from '../../../lib/cn'
import { recordVocabResults } from '../../../lib/api'
import { FlashcardDeck } from './FlashcardDeck'
import { VocabQuiz } from './VocabQuiz'
import type { VocabCard } from '../../../data/types'

interface VocabSectionProps {
  cards: VocabCard[]
}

/** Vocabulary panel: flashcards for learning + a memory quiz for testing. */
export function VocabSection({ cards }: VocabSectionProps) {
  const [tab, setTab] = useState<'learn' | 'quiz'>('learn')

  return (
    <div>
      <div className="mb-5 flex justify-center">
        <div className="inline-flex gap-1 rounded-xl bg-slate-100 p-1">
          {(
            [
              { id: 'learn', label: 'Học thẻ', icon: Layers },
              { id: 'quiz', label: 'Kiểm tra', icon: Brain },
            ] as const
          ).map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  tab === t.id
                    ? 'bg-white text-violet-700 shadow-card'
                    : 'text-slate-500 hover:text-slate-700',
                )}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {tab === 'learn' ? (
        <FlashcardDeck cards={cards} />
      ) : (
        <VocabQuiz
          cards={cards}
          onFinish={(results) => {
            recordVocabResults(results).catch((e) =>
              console.warn('Lưu tiến trình từ vựng thất bại', e),
            )
          }}
        />
      )}
    </div>
  )
}
