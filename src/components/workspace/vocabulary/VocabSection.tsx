import { useState } from 'react'
import { Brain, GraduationCap, Layers } from 'lucide-react'
import { cn } from '../../../lib/cn'
import { FlashcardDeck } from './FlashcardDeck'
import { VocabLearnSession } from './VocabLearnSession'
import { VocabQuiz } from './VocabQuiz'
import type { VocabCard } from '../../../data/types'

interface VocabSectionProps {
  cards: VocabCard[]
  /** Called from the "Hoàn thành bài học" button — only reachable once every
   *  word has climbed to the lesson's target memory level. */
  onLessonComplete?: () => void
}

type Tab = 'learn' | 'browse' | 'quiz'

const TABS: { id: Tab; label: string; icon: typeof Brain }[] = [
  { id: 'learn', label: 'Học', icon: GraduationCap },
  { id: 'browse', label: 'Tra thẻ', icon: Layers },
  { id: 'quiz', label: 'Kiểm tra', icon: Brain },
]

/**
 * Vocabulary panel. The default "Học" tab interleaves meeting a new word with
 * quizzing it right away (Lingoland-style) instead of forcing the learner to
 * page through every flashcard before any practice.
 */
export function VocabSection({ cards, onLessonComplete }: VocabSectionProps) {
  const [tab, setTab] = useState<Tab>('learn')

  return (
    <div>
      <div className="mb-5 flex justify-center">
        <div className="inline-flex gap-1 rounded-xl bg-slate-100 p-1">
          {TABS.map((t) => {
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

      {tab === 'learn' && (
        <VocabLearnSession cards={cards} onLessonComplete={onLessonComplete} />
      )}
      {tab === 'browse' && <FlashcardDeck cards={cards} />}
      {tab === 'quiz' && <VocabQuiz cards={cards} />}
    </div>
  )
}
