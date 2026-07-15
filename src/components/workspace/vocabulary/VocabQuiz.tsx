import { useRef, useState } from 'react'
import {
  Check,
  Ear,
  Eye,
  Headphones,
  Keyboard,
  Loader2,
  RotateCcw,
  Shuffle,
  SquarePen,
  Trophy,
  Volume2,
  X,
} from 'lucide-react'
import { cn } from '../../../lib/cn'
import { useSpeak } from '../../../hooks/useSpeak'
import { answerVocab, answerVocabCheck } from '../../../lib/answersApi'
import { availableKinds, type ExerciseKind } from '../../../lib/vocabSession'
import type { VocabCard } from '../../../data/types'

type ConcreteMode =
  | 'tf'
  | 'listen-meaning'
  | 'word-meaning'
  | 'meaning-word'
  | 'type-word'
  | 'listen-type'
  | 'cloze'
type QuizMode = 'mixed' | ConcreteMode

const CONCRETE: ConcreteMode[] = [
  'tf',
  'listen-meaning',
  'word-meaning',
  'meaning-word',
  'type-word',
  'listen-type',
  'cloze',
]

const NEEDS_SPEECH: ConcreteMode[] = ['listen-meaning', 'listen-type']

interface Question {
  card: VocabCard
  mode: ConcreteMode
  options: string[] // MC option texts ([] for typing modes)
  answer: string
  cloze?: string // blanked sentence (cloze mode)
  tfMeaning?: string // đúng/sai: nghĩa đang được gán cho từ (có thể là nghĩa từ khác)
}

const MODE_META: { id: QuizMode; label: string; desc: string; icon: typeof Ear }[] = [
  { id: 'mixed', label: 'Tổng hợp', desc: 'Trộn đủ 7 dạng', icon: Shuffle },
  { id: 'tf', label: 'Đúng hay sai?', desc: 'Nghĩa này có phải của từ đó', icon: Check },
  { id: 'listen-meaning', label: 'Nghe → nghĩa', desc: 'Nghe từ, chọn nghĩa', icon: Ear },
  { id: 'word-meaning', label: 'Từ → nghĩa', desc: 'Nhìn từ, chọn nghĩa', icon: Eye },
  { id: 'meaning-word', label: 'Nghĩa → từ', desc: 'Nhìn nghĩa, chọn từ', icon: Eye },
  { id: 'type-word', label: 'Nghĩa → gõ từ', desc: 'Nhìn nghĩa, gõ lại từ', icon: Keyboard },
  { id: 'listen-type', label: 'Nghe → gõ từ', desc: 'Nghe rồi gõ lại (chính tả)', icon: Headphones },
  { id: 'cloze', label: 'Điền vào câu', desc: 'Chọn từ điền vào chỗ trống', icon: SquarePen },
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function distractors(pool: string[], exclude: string, n: number): string[] {
  const uniq = [...new Set(pool)].filter((v) => v && v !== exclude)
  return shuffle(uniq).slice(0, n)
}

function blankWord(sentence: string, word: string): string | null {
  const esc = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`\\b${esc}\\b`, 'i')
  if (!re.test(sentence)) return null
  return sentence.replace(new RegExp(`\\b${esc}\\b`, 'ig'), '______')
}

function buildQuestions(
  cards: VocabCard[],
  mode: QuizMode,
  count: number,
  canSpeak: boolean,
): Question[] {
  const meanings = cards.map((c) => c.meaning)
  const words = cards.map((c) => c.word)
  const picked = shuffle(cards).slice(0, Math.min(count, cards.length))
  // Không bao giờ ra câu nghe trên trình duyệt không phát âm được: người học
  // không thể trả lời, mà câu sai lại gỡ mất một dạng đã qua.
  const usable = CONCRETE.filter((m) => canSpeak || !NEEDS_SPEECH.includes(m))

  return picked.map((card, i) => {
    let m: ConcreteMode = mode === 'mixed' ? usable[i % usable.length] : mode
    if (!canSpeak && NEEDS_SPEECH.includes(m)) m = 'word-meaning'

    if (m === 'tf') {
      const others = cards.filter((c) => c.id !== card.id)
      const decoy = others.length ? others[Math.floor(Math.random() * others.length)] : null
      const showTrue = !decoy || Math.random() < 0.5
      const shown = showTrue ? card : (decoy as VocabCard)
      return {
        card,
        mode: m,
        options: ['Sai', 'Đúng'],
        answer: showTrue ? 'Đúng' : 'Sai',
        tfMeaning: shown.meaning,
      }
    }

    // Cloze needs the word to appear in the example; else fall back.
    let cloze: string | undefined
    if (m === 'cloze') {
      const blanked = card.example ? blankWord(card.example, card.word) : null
      if (blanked) cloze = blanked
      else m = 'meaning-word'
    }

    if (m === 'type-word' || m === 'listen-type') {
      return { card, mode: m, options: [], answer: card.word }
    }
    const useWords = m === 'meaning-word' || m === 'cloze'
    const correct = useWords ? card.word : card.meaning
    const pool = useWords ? words : meanings
    const options = shuffle([correct, ...distractors(pool, correct, 3)])
    return { card, mode: m, options, answer: correct, cloze }
  })
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')

/** Mode kiểm tra ở đây ↔ DẠNG (kind) mà DB ghi vào kinds_ok. */
const MODE_KIND: Record<ConcreteMode, ExerciseKind> = {
  tf: 'tf',
  'listen-meaning': 'listen-meaning',
  'word-meaning': 'word-meaning',
  'meaning-word': 'meaning-word',
  'type-word': 'type',
  'listen-type': 'listen-type',
  cloze: 'cloze',
}

interface VocabQuizProps {
  cards: VocabCard[]
  /**
   * `lesson` (mặc định) — mỗi câu đúng ghi thêm một DẠNG vào cổng 6-dạng của từ.
   * `review`  — phiên ôn tập ngắt quãng: đúng thì LÊN cấp, sai thì tụt cấp.
   */
  mode?: 'lesson' | 'review'
  /** Fired once when the session ends (each answer is already saved to the DB). */
  onFinish?: () => void
  /** Force a fixed number of questions (default: user picks). */
  fixedCount?: number
  /** Hide the setup screen and auto-start in mixed mode (for external review). */
  autoStart?: boolean
  /** When provided, the result screen shows a "Kết thúc" button. */
  onExit?: () => void
}

export function VocabQuiz({
  cards,
  mode: saveMode = 'lesson',
  onFinish,
  fixedCount,
  autoStart = false,
  onExit,
}: VocabQuizProps) {
  const { speak, supported } = useSpeak()
  const [mode, setMode] = useState<QuizMode>('mixed')
  const [count, setCount] = useState(fixedCount ?? 10)
  const [phase, setPhase] = useState<'setup' | 'playing' | 'done'>(
    autoStart ? 'playing' : 'setup',
  )
  const [questions, setQuestions] = useState<Question[]>(() =>
    autoStart
      ? buildQuestions(
          cards,
          'mixed',
          fixedCount ?? cards.length,
          typeof window !== 'undefined' && 'speechSynthesis' in window,
        )
      : [],
  )
  const [idx, setIdx] = useState(0)
  const [pickedOpt, setPickedOpt] = useState<string | null>(null)
  const [typed, setTyped] = useState('')
  const [checked, setChecked] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongCards, setWrongCards] = useState<VocabCard[]>([])
  const resultsRef = useRef<{ id: number; correct: boolean }[]>([])

  const maxCount = cards.length
  const speakSoon = (q?: Question) => {
    if (q && (q.mode === 'listen-meaning' || q.mode === 'listen-type') && supported)
      setTimeout(() => speak(q.card.word), 220)
  }

  const start = (overrideCards?: VocabCard[]) => {
    const src = overrideCards ?? cards
    const n = overrideCards ? src.length : Math.min(count, src.length)
    const qs = buildQuestions(src, mode, n, supported)
    setQuestions(qs)
    setIdx(0)
    setPickedOpt(null)
    setTyped('')
    setChecked(false)
    setCorrectCount(0)
    setWrongCards([])
    resultsRef.current = []
    setPhase('playing')
    speakSoon(qs[0])
  }

  const q = questions[idx]

  const submit = () => {
    if (checked || !q) return
    const isTyping = q.mode === 'type-word' || q.mode === 'listen-type'
    const ok = isTyping ? norm(typed) === norm(q.answer) : pickedOpt === q.answer
    setChecked(true)
    if (ok) setCorrectCount((c) => c + 1)
    else setWrongCards((w) => [...w, q.card])
    // persist THIS single answer immediately
    if (q.card.vocabItemId != null) {
      resultsRef.current.push({ id: q.card.vocabItemId, correct: ok })
      const save =
        saveMode === 'review'
          ? answerVocab(q.card.vocabItemId, ok)
          : answerVocabCheck(
              q.card.vocabItemId,
              MODE_KIND[q.mode],
              ok,
              availableKinds(q.card, supported).length,
            )
      save.catch((e) => console.warn('Lưu tiến trình từ vựng thất bại', e))
    }
  }

  const next = () => {
    if (idx + 1 >= questions.length) {
      setPhase('done')
      onFinish?.()
      return
    }
    const ni = idx + 1
    setIdx(ni)
    setPickedOpt(null)
    setTyped('')
    setChecked(false)
    speakSoon(questions[ni])
  }

  // ---- Setup ---------------------------------------------------------------
  if (phase === 'setup') {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <h3 className="text-base font-bold text-slate-900">
            Kiểm tra ghi nhớ từ vựng
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Chọn kiểu kiểm tra và số câu. Mỗi kiểu trả lời đúng sẽ tính là một
            “dạng đã qua” — đủ 6 dạng khác nhau thì từ đó mới được coi là đã thuộc.
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {MODE_META.filter(
              (m) => supported || (m.id !== 'listen-meaning' && m.id !== 'listen-type'),
            ).map((m) => {
              const Icon = m.icon
              const active = m.id === mode
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all',
                    active
                      ? 'border-violet-400 bg-violet-50 ring-1 ring-violet-200'
                      : 'border-slate-200 hover:border-violet-300 hover:bg-slate-50',
                  )}
                >
                  <span
                    className={cn(
                      'grid h-9 w-9 shrink-0 place-items-center rounded-lg',
                      active ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-800">
                      {m.label}
                    </span>
                    <span className="block text-xs text-slate-500">{m.desc}</span>
                  </span>
                </button>
              )
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-600">Số câu:</span>
            {[10, 20, maxCount].map((n, i) => {
              const val = i === 2 ? maxCount : Math.min(n, maxCount)
              const label = i === 2 ? `Tất cả (${maxCount})` : String(val)
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setCount(val)}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                    count === val
                      ? 'border-violet-400 bg-violet-50 text-violet-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => start()}
            className="press mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white shadow-card hover:bg-violet-700"
          >
            Bắt đầu kiểm tra
          </button>
        </div>
      </div>
    )
  }

  // ---- Done ----------------------------------------------------------------
  if (phase === 'done') {
    const pct = Math.round((correctCount / Math.max(1, questions.length)) * 100)
    return (
      <div className="mx-auto max-w-2xl">
        <div className="animate-pop-in overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="flex flex-col items-center gap-3 bg-gradient-to-br from-violet-600 to-violet-800 p-8 text-center text-white">
            <Trophy className="h-10 w-10 animate-trophy-in" />
            <p className="animate-pop text-4xl font-bold tabular-nums">{pct}%</p>
            <p className="text-sm text-violet-100">
              Đúng {correctCount}/{questions.length} câu · đã lưu tiến trình
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 p-5">
            <button
              type="button"
              onClick={() => (autoStart ? start() : setPhase('setup'))}
              className="press inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" />
              Lượt mới
            </button>
            {wrongCards.length > 0 && (
              <button
                type="button"
                onClick={() => start(wrongCards)}
                className="press inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-card hover:bg-violet-700"
              >
                Ôn lại {wrongCards.length} từ sai
              </button>
            )}
            {onExit && (
              <button
                type="button"
                onClick={onExit}
                className="press inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-900"
              >
                Kết thúc
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ---- Playing -------------------------------------------------------------
  if (!q) return null
  const isTyping = q.mode === 'type-word' || q.mode === 'listen-type'
  const isCorrect = isTyping
    ? norm(typed) === norm(q.answer)
    : pickedOpt === q.answer
  const canSubmit = isTyping ? typed.trim().length > 0 : pickedOpt !== null

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-600">
          Câu {idx + 1}/{questions.length}
        </span>
        <span className="text-slate-500">
          Đúng <span className="font-bold text-emerald-600">{correctCount}</span>
        </span>
      </div>

      <div
        key={idx}
        className="animate-fade-slide-up rounded-2xl border border-slate-200 bg-white p-6 shadow-card"
      >
        {/* Prompt by mode */}
        {q.mode === 'tf' ? (
          <div className="py-2 text-center">
            <p className="text-lg text-slate-800">{q.tfMeaning}</p>
            <p className="my-3 text-sm font-medium text-emerald-600">là nghĩa của</p>
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-3xl font-bold text-slate-900">{q.card.word}</h3>
              {supported && (
                <button
                  type="button"
                  onClick={() => speak(q.card.word)}
                  className="grid h-8 w-8 place-items-center rounded-full bg-violet-100 text-violet-700 hover:bg-violet-200"
                  aria-label="Nghe phát âm"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ) : q.mode === 'listen-meaning' || q.mode === 'listen-type' ? (
          <div className="flex flex-col items-center gap-3 py-2">
            <button
              type="button"
              onClick={() => speak(q.card.word)}
              className="grid h-20 w-20 place-items-center rounded-full bg-violet-100 text-violet-700 transition-colors hover:bg-violet-200"
              aria-label="Nghe lại từ"
            >
              <Volume2 className="h-8 w-8" />
            </button>
            <p className="text-sm text-slate-500">
              {q.mode === 'listen-type'
                ? 'Nghe và gõ lại từ (chính tả)'
                : 'Nghe và chọn nghĩa đúng'}
            </p>
          </div>
        ) : q.mode === 'word-meaning' ? (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-3xl font-bold text-slate-900">{q.card.word}</h3>
              {supported && (
                <button
                  type="button"
                  onClick={() => speak(q.card.word)}
                  className="grid h-8 w-8 place-items-center rounded-full bg-violet-100 text-violet-700 hover:bg-violet-200"
                  aria-label="Nghe phát âm"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-400">{q.card.ipa}</p>
            <p className="mt-2 text-sm text-slate-500">Chọn nghĩa đúng</p>
          </div>
        ) : q.mode === 'cloze' ? (
          <div className="text-center">
            <p className="text-lg font-medium leading-relaxed text-slate-800">
              “{q.cloze}”
            </p>
            <p className="mt-2 text-sm text-violet-700">{q.card.meaning}</p>
            <p className="mt-1 text-sm text-slate-500">Chọn từ điền vào chỗ trống</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-xl font-semibold text-violet-900">{q.card.meaning}</p>
            <p className="mt-2 text-sm text-slate-500">Gõ lại từ tiếng Anh</p>
          </div>
        )}

        {/* Answer area */}
        {isTyping ? (
          <div className="mt-5">
            <input
              type="text"
              value={typed}
              autoFocus
              disabled={checked}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') checked ? next() : submit()
              }}
              placeholder="Nhập từ…"
              className={cn(
                'w-full rounded-xl border px-4 py-3 text-center text-lg outline-none transition-colors',
                checked
                  ? isCorrect
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                    : 'animate-shake border-rose-400 bg-rose-50 text-rose-800'
                  : 'border-slate-200 focus:border-violet-500',
              )}
            />
            {checked && !isCorrect && (
              <p className="mt-2 text-center text-sm text-slate-600">
                Đáp án đúng:{' '}
                <span className="font-bold text-emerald-600">{q.answer}</span>
              </p>
            )}
          </div>
        ) : (
          <div
            className={cn(
              'mt-5 grid gap-2',
              q.mode === 'tf' ? 'grid-cols-2' : 'sm:grid-cols-2',
              checked && !isCorrect && 'animate-shake',
            )}
          >
            {q.options.map((opt) => {
              const isPicked = pickedOpt === opt
              const showCorrect = checked && opt === q.answer
              const showWrong = checked && isPicked && opt !== q.answer
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={checked}
                  onClick={() => setPickedOpt(opt)}
                  className={cn(
                    'press flex items-center gap-2 rounded-xl border px-4 py-3 text-left text-sm transition-all',
                    showCorrect && 'border-emerald-400 bg-emerald-50',
                    showWrong && 'border-rose-400 bg-rose-50',
                    !checked && isPicked && 'border-violet-500 bg-violet-50 ring-1 ring-violet-200',
                    !checked && !isPicked && 'border-slate-200 hover:border-violet-300 hover:bg-slate-50',
                    checked && !showCorrect && !showWrong && 'opacity-60',
                  )}
                >
                  {showCorrect && <Check className="h-4 w-4 shrink-0 animate-pop text-emerald-600" />}
                  {showWrong && <X className="h-4 w-4 shrink-0 text-rose-600" />}
                  <span className="text-slate-800">{opt}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Reveal card after checking */}
        {checked && (
          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm">
            <p className="font-semibold text-slate-800">
              {q.card.word}{' '}
              <span className="font-normal text-slate-400">{q.card.ipa}</span> —{' '}
              {q.card.meaning}
            </p>
            {q.card.example && (
              <>
                <p className="mt-1 italic text-slate-600">“{q.card.example}”</p>
                <p className="text-slate-500">{q.card.exampleTranslation}</p>
              </>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-5">
          {!checked ? (
            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              className="press inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white shadow-card hover:bg-violet-700 disabled:opacity-50"
            >
              Kiểm tra
            </button>
          ) : (
            <button
              type="button"
              onClick={next}
              className={cn(
                'press inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-card',
                isCorrect ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-700 hover:bg-slate-800',
              )}
            >
              {idx + 1 >= questions.length ? 'Xem kết quả' : 'Câu tiếp theo'}
            </button>
          )}
        </div>
      </div>

      {!supported && (q.mode === 'listen-meaning' || q.mode === 'listen-type') && (
        <p className="mt-3 flex items-center justify-center gap-2 text-xs text-amber-600">
          <Loader2 className="h-3.5 w-3.5" />
          Trình duyệt không hỗ trợ đọc giọng nói — kiểu có âm thanh sẽ không phát.
        </p>
      )}
    </div>
  )
}
