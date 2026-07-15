import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Loader2,
  RotateCcw,
  Sprout,
  Trophy,
  Volume2,
  X,
} from 'lucide-react'
import { cn } from '../../../lib/cn'
import { useSpeak } from '../../../hooks/useSpeak'
import { answerVocabCheck, getVocabProgressFor } from '../../../lib/answersApi'
import {
  ACTIVE_LIMIT,
  CHECKS_MAX,
  CHECKS_MIN,
  INTRO_BATCH,
  LEVEL_INTERVAL,
  LEVEL_NAME,
  STEP_LABEL,
  activeWords,
  availableKinds,
  buildStep,
  initScheduler,
  isTypedCorrect,
  markAsked,
  nextPlan,
  remaining,
  requiredChecks,
  type ExerciseKind,
  type Plan,
  type SchedulerState,
  type SessionStep,
  type VocabLevel,
  type WordState,
} from '../../../lib/vocabSession'
import { CheckDots, LevelRing, LevelLegend } from './LevelRing'
import type { VocabCard, WordForm } from '../../../data/types'

const FORM_LABEL: Record<WordForm, string> = {
  n: 'noun',
  v: 'verb',
  adj: 'adjective',
  adv: 'adverb',
  prep: 'preposition',
  conj: 'conjunction',
  phr: 'phrasal verb',
}

interface Props {
  cards: VocabCard[]
  /** Chỉ bấm được khi MỌI từ đã qua đủ 6 dạng kiểm tra. */
  onLessonComplete?: () => void
  /** Nút quay lại (dùng ở trang "Ôn từ vựng"). */
  onExit?: () => void
}

export function VocabLearnSession({ cards, onLessonComplete, onExit }: Props) {
  const { speak, supported } = useSpeak()

  const [loading, setLoading] = useState(true)
  const [words, setWords] = useState<Record<string, WordState>>({})
  const [plan, setPlan] = useState<Plan | null>(null)
  const [finished, setFinished] = useState(false)
  /** Đếm câu hỏi — CHỈ tăng khi sang câu mới. Dùng làm `key` cho thẻ câu hỏi để
   *  hiệu ứng vào chạy đúng MỘT LẦN mỗi câu, không lặp lại lúc đang gõ. */
  const [stepSeq, setStepSeq] = useState(0)

  const [picked, setPicked] = useState<string | null>(null)
  const [typed, setTyped] = useState('')
  const [checked, setChecked] = useState(false)
  const [wasCorrect, setWasCorrect] = useState(false)
  /** Từ vừa tốt nghiệp 0 → 1 ở câu vừa rồi. */
  const [justPassed, setJustPassed] = useState(false)

  /** Không tải được tiến trình -> KHÔNG được coi như chưa học gì. */
  const [loadError, setLoadError] = useState<string | null>(null)
  /** Đang ghi câu trả lời xuống DB. */
  const [saving, setSaving] = useState(false)
  /** Ghi thất bại -> chặn đi tiếp cho tới khi lưu được. */
  const [saveError, setSaveError] = useState<string | null>(null)

  const sched = useRef<SchedulerState | null>(null)
  const stepRef = useRef<SessionStep | null>(null)
  /** Câu trả lời đang chờ ghi (để bấm "Thử lại"). */
  const pending = useRef<{
    cardId: string
    itemId: number
    kind: ExerciseKind
    ok: boolean
    pool: number
    prev: WordState
  } | null>(null)

  // ---- tải tiến trình (dạng đã qua + cấp độ) từ DB rồi bắt đầu ---------------
  const startLesson = useCallback(async () => {
    setLoading(true)
    setFinished(false)
    setLoadError(null)
    setSaveError(null)
    const ids = cards.map((c) => c.vocabItemId).filter((v): v is number => v != null)
    const next: Record<string, WordState> = {}
    try {
      const prog = await getVocabProgressFor(ids)
      for (const c of cards) {
        const p = c.vocabItemId != null ? prog[c.vocabItemId] : undefined
        next[c.id] = {
          level: ((p?.level ?? 0) as VocabLevel) ?? 0,
          kinds: (p?.kindsOk ?? []) as ExerciseKind[],
        }
      }
    } catch (e) {
      // Nếu coi như "chưa học gì" thì học lại từ đầu 20 từ và câu sai đầu tiên sẽ
      // hạ cấp từ đã thuộc — thà báo lỗi còn hơn.
      console.warn('Không tải được tiến trình từ vựng', e)
      setLoadError((e as Error)?.message ?? 'Không tải được tiến trình')
      setLoading(false)
      return
    }
    setWords(next)
    sched.current = initScheduler(cards, next, supported)
    advanceFrom(next)
    setLoading(false)
  }, [cards, supported]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void startLesson()
  }, [startLesson])

  const resetPrompt = () => {
    setPicked(null)
    setTyped('')
    setChecked(false)
    setJustPassed(false)
    setSaving(false)
    setSaveError(null)
    pending.current = null
  }

  /** Đẩy bộ lập lịch tới việc kế tiếp dựa trên trạng thái từ mới nhất. */
  const advanceFrom = useCallback(
    (next: Record<string, WordState>) => {
      const st = sched.current
      if (!st) return
      st.words = next
      const p = nextPlan(cards, st)
      setPlan(p)
      if (p) {
        markAsked(st, p)
        stepRef.current = buildStep(p.card, p.kind, cards)
        setFinished(false)
      } else {
        stepRef.current = null
        setFinished(true)
      }
      setStepSeq((n) => n + 1)
      resetPrompt()
    },
    [cards],
  )

  const step = stepRef.current
  const card = plan?.card ?? null

  // tự phát âm ở các bước nghe / làm quen từ mới
  useEffect(() => {
    if (!step || !supported) return
    if (
      step.kind === 'listen-meaning' ||
      step.kind === 'listen-type' ||
      step.kind === 'intro'
    )
      setTimeout(() => speak(step.card.word), 250)
  }, [plan]) // eslint-disable-line react-hooks/exhaustive-deps

  const st = sched.current
  const passedCount = useMemo(
    () => (st ? cards.length - remaining(cards, st).length : 0),
    [cards, words], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const pct = Math.round((passedCount / Math.max(1, cards.length)) * 100)

  // ---- ghi 1 câu trả lời xuống DB (nguồn sự thật) -----------------------------
  const persist = useCallback(async () => {
    const p = pending.current
    if (!p) return
    setSaving(true)
    setSaveError(null)
    try {
      const r = await answerVocabCheck(p.itemId, p.kind, p.ok, p.pool)
      setWords((prevWords) => {
        const merged = {
          ...prevWords,
          [p.cardId]: {
            level: r.level as VocabLevel,
            kinds: r.kindsOk as ExerciseKind[],
          },
        }
        if (sched.current) sched.current.words = merged
        return merged
      })
      setJustPassed(p.prev.level === 0 && r.level === 1)
      pending.current = null
    } catch (e) {
      // KHÔNG được giữ tiến trình lạc quan khi DB chưa ghi được — nếu không, người
      // học có thể "hoàn thành bài" mà DB trống trơn.
      setWords((prevWords) => {
        const rolled = { ...prevWords, [p.cardId]: p.prev }
        if (sched.current) sched.current.words = rolled
        return rolled
      })
      setJustPassed(false)
      setSaveError((e as Error)?.message ?? 'Không lưu được câu trả lời')
    } finally {
      setSaving(false)
    }
  }, [])

  // ---- chấm 1 câu ------------------------------------------------------------
  const check = useCallback(() => {
    if (!card || !step || checked || step.kind === 'intro') return
    const typing = step.kind === 'type' || step.kind === 'listen-type'
    const ok = typing ? isTypedCorrect(typed, step.answer) : picked === step.answer
    const kind = step.kind as ExerciseKind

    setWasCorrect(ok)
    setChecked(true)

    // cập nhật lạc quan: đúng → thêm dạng, sai → gỡ dạng (phải kiểm tra lại)
    const cur = words[card.id] ?? { level: 0 as VocabLevel, kinds: [] }
    const kinds = ok
      ? cur.kinds.includes(kind)
        ? cur.kinds
        : [...cur.kinds, kind]
      : cur.kinds.filter((k) => k !== kind)
    const need = requiredChecks(card, supported)
    const level: VocabLevel = cur.level === 0 && kinds.length >= need ? 1 : cur.level
    setJustPassed(cur.level === 0 && level === 1)

    const next = { ...words, [card.id]: { level, kinds } }
    setWords(next)
    if (sched.current) sched.current.words = next

    if (card.vocabItemId == null) {
      setSaveError('Thẻ từ này thiếu mã trong CSDL — không lưu được tiến trình.')
      return
    }
    pending.current = {
      cardId: card.id,
      itemId: card.vocabItemId,
      kind,
      ok,
      pool: availableKinds(card, supported).length,
      prev: cur,
    }
    void persist()
  }, [card, step, checked, typed, picked, words, supported, persist])

  const cont = useCallback(() => {
    // Chỉ đi tiếp khi câu vừa rồi đã nằm chắc trong DB.
    if (saving || saveError) return
    advanceFrom({ ...words })
  }, [advanceFrom, words, saving, saveError])

  const primary = useCallback(() => {
    if (!step) return
    if (step.kind === 'intro') {
      cont()
      return
    }
    if (!checked) check()
    else cont()
  }, [step, checked, check, cont])

  // ---- phím tắt --------------------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!step || finished || loading) return
      const tag = (e.target as HTMLElement)?.tagName
      const typingField = tag === 'INPUT' || tag === 'TEXTAREA'

      if (e.key === 'Enter' || (step.kind === 'intro' && e.code === 'Space')) {
        e.preventDefault()
        primary()
        return
      }
      if (typingField || checked || step.kind === 'intro') return
      const n = Number(e.key)
      if (n >= 1 && n <= step.options.length) {
        e.preventDefault()
        setPicked(step.options[n - 1])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step, checked, finished, loading, primary])

  if (loading) {
    // Khung xương theo đúng hình hài bài học (đỡ giật hơn spinner trơ).
    return (
      <div className="mx-auto max-w-2xl space-y-4" aria-busy="true" aria-live="polite">
        <span className="sr-only">Đang tải tiến trình ghi nhớ…</span>
        <div className="skeleton h-14 rounded-2xl" />
        <div className="skeleton h-2 w-full rounded-full" />
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="skeleton mx-auto h-6 w-24 rounded-full" />
          <div className="skeleton mx-auto mt-4 h-10 w-48 rounded-xl" />
          <div className="skeleton mx-auto mt-3 h-5 w-32 rounded-lg" />
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <div className="skeleton h-16 rounded-xl" />
            <div className="skeleton h-16 rounded-xl" />
            <div className="skeleton h-16 rounded-xl" />
            <div className="skeleton h-16 rounded-xl" />
          </div>
          <div className="skeleton mt-5 h-12 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  // Tải tiến trình thất bại -> KHÔNG bắt đầu bài học với dữ liệu rỗng.
  if (loadError) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-rose-500" />
        <p className="mt-3 font-bold text-rose-800">Không tải được tiến trình</p>
        <p className="mt-1 text-sm text-rose-700">{loadError}</p>
        <button
          type="button"
          onClick={() => void startLesson()}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-700"
        >
          <RotateCcw className="h-4 w-4" /> Thử lại
        </button>
      </div>
    )
  }

  // ---- hoàn thành ------------------------------------------------------------
  if (finished || !plan || !step || !card) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="flex flex-col items-center gap-2 bg-gradient-to-br from-emerald-600 to-emerald-800 p-8 text-center text-white">
            <Trophy className="h-10 w-10 animate-trophy-in" />
            <p className="text-3xl font-bold">Đã thuộc {cards.length} từ!</p>
            <p className="text-sm text-emerald-100">
              Mỗi từ đều đã vượt qua đủ số dạng kiểm tra khác nhau
            </p>
          </div>
          <div className="p-5">
            <div className="stagger mb-4 grid gap-2 sm:grid-cols-2">
              {cards.map((c) => {
                const w = words[c.id] ?? { level: 0 as VocabLevel, kinds: [] }
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2"
                  >
                    <LevelRing level={w.level} size={30} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {c.word}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {LEVEL_NAME[w.level]} · ôn lại sau {LEVEL_INTERVAL[w.level]}
                      </p>
                    </div>
                    <CheckDots
                      done={w.kinds.length}
                      need={requiredChecks(c, supported)}
                    />
                  </div>
                )
              })}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {onExit && (
                <button
                  type="button"
                  onClick={onExit}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" /> Quay lại
                </button>
              )}
              {onLessonComplete && (
                <button
                  type="button"
                  onClick={onLessonComplete}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-card hover:bg-emerald-700"
                >
                  <Check className="h-4 w-4" /> Hoàn thành bài học
                </button>
              )}
            </div>
            <p className="mt-3 text-center text-xs text-slate-400">
              Muốn luyện thêm những từ này, mở tab <b>Kiểm tra</b>. Các cấp độ tiếp
              theo sẽ lên dần ở mục <b>Ôn từ vựng</b> theo lịch ngắt quãng.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const w = words[card.id] ?? { level: 0 as VocabLevel, kinds: [] }
  const need = requiredChecks(card, supported)
  const isIntro = step.kind === 'intro'
  const isTyping = step.kind === 'type' || step.kind === 'listen-type'
  const isListening = step.kind === 'listen-meaning' || step.kind === 'listen-type'
  const isTF = step.kind === 'tf'
  const canSubmit = isIntro || (isTyping ? typed.trim().length > 0 : picked !== null)
  const introIdx = sched.current ? sched.current.introduced.size : 0
  const activeCount = sched.current ? activeWords(cards, sched.current).length : 0

  const speakBtn = (size = 'h-9 w-9', icon = 'h-4 w-4') =>
    supported && (
      <button
        type="button"
        onClick={() => speak(card.word)}
        aria-label="Nghe phát âm"
        className={cn(
          'grid shrink-0 place-items-center rounded-full bg-violet-100 text-violet-700 hover:bg-violet-200',
          size,
        )}
      >
        <Volume2 className={icon} />
      </button>
    )

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <LevelLegend />

      {/* Tiến độ bài học + tiến độ ghi nhớ của TỪ đang học */}
      <div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="bar-fill h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-bold text-slate-700">
            {STEP_LABEL[step.kind]}
            {isIntro && (
              <span className="ml-1.5 text-xs font-medium text-slate-400">
                (từ {Math.min(introIdx, cards.length)}/{cards.length} · học{' '}
                {INTRO_BATCH} từ rồi {CHECKS_MIN}–{CHECKS_MAX} câu hỏi trộn lẫn)
              </span>
            )}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              Đang học{' '}
              <span className="font-bold text-violet-700">{activeCount}</span> · đã qua{' '}
              <span className="font-bold text-emerald-700">
                {passedCount}/{cards.length}
              </span>{' '}
              từ
            </span>
            <div className="flex items-center gap-1.5">
              <CheckDots done={w.kinds.length} need={need} />
              <LevelRing level={w.level} size={30} />
            </div>
          </div>
        </div>
      </div>

      {/* key={stepSeq} => thẻ câu hỏi trượt/nở vào ĐÚNG MỘT LẦN mỗi câu; khi đang
          gõ (component re-render liên tục) key giữ nguyên nên hiệu ứng KHÔNG lặp. */}
      <div
        key={stepSeq}
        className={cn(
          'rounded-2xl border border-slate-200 bg-white p-6 shadow-card',
          isIntro ? 'animate-pop-in' : 'animate-fade-slide-up',
        )}
      >
        {/* ---------------- LÀM QUEN TỪ MỚI ---------------- */}
        {isIntro ? (
          <div className="text-center">
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-700">
              <Sprout className="h-3.5 w-3.5" /> Từ mới
            </span>
            <div className="mt-4 flex items-center justify-center gap-3">
              <h3 className="text-4xl font-bold text-slate-900">{card.word}</h3>
              {speakBtn('h-10 w-10', 'h-5 w-5')}
            </div>
            <p className="mt-1 text-lg text-slate-500">{card.ipa}</p>
            <p className="mt-4 text-sm italic text-slate-500">
              ({FORM_LABEL[card.wordForm]})
            </p>
            <p className="mt-1 text-2xl font-bold text-violet-900">{card.meaning}</p>
            {card.example && (
              <div className="mt-5 rounded-xl bg-slate-50 p-4 text-left text-sm">
                <p className="italic text-slate-700">“{card.example}”</p>
                <p className="mt-1 text-slate-500">{card.exampleTranslation}</p>
              </div>
            )}
            <p className="mt-5 text-xs font-medium text-slate-400">
              Phải trả lời đúng {need} dạng câu hỏi khác nhau thì từ này mới “qua”.
            </p>
          </div>
        ) : (
          <>
            {/* ---------------- ĐỀ BÀI ---------------- */}
            {isTF ? (
              <div className="py-2 text-center">
                <p className="text-lg text-slate-800">
                  <span className="italic text-slate-500">
                    ({FORM_LABEL[(step.tfWordForm ?? 'n') as WordForm]})
                  </span>{' '}
                  {step.tfMeaning}
                </p>
                <p className="my-3 text-sm font-medium text-emerald-600">là nghĩa của</p>
                <div className="flex items-center justify-center gap-2">
                  <h3 className="text-3xl font-bold text-slate-900">{card.word}</h3>
                  {speakBtn('h-8 w-8')}
                </div>
              </div>
            ) : isListening ? (
              <div className="flex flex-col items-center gap-3 py-2">
                <button
                  type="button"
                  onClick={() => speak(card.word)}
                  aria-label="Nghe lại"
                  className="grid h-20 w-20 place-items-center rounded-full bg-violet-100 text-violet-700 hover:bg-violet-200"
                >
                  <Volume2 className="h-8 w-8" />
                </button>
                <p className="text-sm text-slate-500">
                  {step.kind === 'listen-type'
                    ? 'Nghe và viết lại từ'
                    : 'Nghe và chọn nghĩa đúng'}
                </p>
              </div>
            ) : step.kind === 'word-meaning' ? (
              <div className="flex items-center justify-center gap-2">
                <h3 className="text-3xl font-bold text-slate-900">{card.word}</h3>
                {speakBtn('h-8 w-8')}
              </div>
            ) : step.kind === 'cloze' ? (
              <div className="text-center">
                <p className="text-lg leading-relaxed text-slate-800">“{step.cloze}”</p>
                <p className="mt-2 text-sm text-violet-700">{card.meaning}</p>
              </div>
            ) : (
              <div className="text-center">
                <span className="text-sm italic text-slate-500">
                  ({FORM_LABEL[card.wordForm]})
                </span>
                <p className="mt-1 text-xl font-semibold text-violet-900">
                  {card.meaning}
                </p>
              </div>
            )}

            {/* ---------------- TRẢ LỜI ---------------- */}
            {isTyping ? (
              <div className="mt-5">
                <input
                  type="text"
                  value={typed}
                  autoFocus
                  disabled={checked}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder="Viết lại từ tiếng Anh…"
                  className={cn(
                    'w-full rounded-xl border px-4 py-3 text-center text-lg outline-none transition-colors',
                    checked
                      ? wasCorrect
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                        : 'animate-shake border-rose-400 bg-rose-50 text-rose-800'
                      : 'border-slate-200 focus:border-violet-500',
                  )}
                />
              </div>
            ) : (
              <div
                className={cn(
                  'mt-5 grid gap-2',
                  isTF ? 'grid-cols-2' : 'sm:grid-cols-2',
                  checked && !wasCorrect && 'animate-shake',
                )}
              >
                {step.options.map((opt, i) => {
                  const isPicked = picked === opt
                  const showCorrect = checked && opt === step.answer
                  const showWrong = checked && isPicked && opt !== step.answer
                  const form = step.optionForms?.[opt]
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={checked}
                      onClick={() => setPicked(opt)}
                      className={cn(
                        'press flex flex-col gap-2 rounded-xl border px-4 py-3 text-left text-sm',
                        isTF && 'items-center justify-center text-base font-semibold',
                        showCorrect && 'border-emerald-400 bg-emerald-50',
                        showWrong && 'border-rose-400 bg-rose-50',
                        !checked && isPicked && 'border-violet-500 bg-violet-50 ring-1 ring-violet-200',
                        !checked && !isPicked && 'border-slate-200 hover:border-violet-300 hover:bg-slate-50',
                        checked && !showCorrect && !showWrong && 'opacity-60',
                      )}
                    >
                      <span className="flex items-center gap-1.5 text-slate-800">
                        {showCorrect && (
                          <Check className="h-4 w-4 shrink-0 animate-pop text-emerald-600" />
                        )}
                        {showWrong && <X className="h-4 w-4 shrink-0 text-rose-600" />}
                        {form && (
                          <span className="italic text-slate-500">
                            ({FORM_LABEL[form as WordForm]})
                          </span>
                        )}
                        {opt}
                      </span>
                      <span className="text-xs text-slate-400">Nhấn {i + 1}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* ---------------- PHẢN HỒI ---------------- */}
            {checked && (
              <div
                className={cn(
                  'mt-4 rounded-xl p-4 text-sm animate-fade-slide-up',
                  wasCorrect ? 'bg-emerald-50' : 'bg-rose-50',
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p
                    className={cn(
                      'flex items-center gap-1.5 font-semibold',
                      wasCorrect ? 'text-emerald-700' : 'text-rose-700',
                    )}
                  >
                    {wasCorrect ? (
                      <>
                        <Check className="h-4 w-4" /> Chính xác! Dạng “
                        {STEP_LABEL[step.kind]}” đã qua
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4" /> Chưa đúng — dạng “
                        {STEP_LABEL[step.kind]}” sẽ được hỏi lại
                      </>
                    )}
                  </p>
                  <span className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                    <CheckDots done={w.kinds.length} need={need} />
                    {w.kinds.length}/{need} dạng
                  </span>
                </div>

                {justPassed && (
                  <p className="mt-2 flex animate-pop items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-emerald-700">
                    <Sprout className="h-4 w-4" />
                    “{card.word}” đã qua {need} dạng → lên “{LEVEL_NAME[1]}” · ôn lại
                    sau {LEVEL_INTERVAL[1]}
                  </p>
                )}

                <p className="mt-2 text-slate-800">
                  <span className="font-bold">{card.word}</span>{' '}
                  <span className="text-slate-400">{card.ipa}</span> — {card.meaning}
                </p>
                {card.example && (
                  <p className="mt-1 italic text-slate-600">“{card.example}”</p>
                )}
              </div>
            )}
          </>
        )}

        {/* ---- Lưu thất bại: chặn đi tiếp cho tới khi DB nhận được câu này ---- */}
        {saveError && (
          <div className="animate-fade-slide-down">
          <div className="mt-4 flex animate-shake flex-wrap items-center gap-3 rounded-xl border border-rose-300 bg-rose-50 p-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
            <p className="flex-1 text-sm font-medium text-rose-800">
              Không lưu được câu trả lời — kiểm tra kết nối. Bài học chỉ đi tiếp khi
              câu này đã vào cơ sở dữ liệu.
            </p>
            <button
              type="button"
              onClick={() => void persist()}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              Thử lại
            </button>
          </div>
          </div>
        )}

        {/* ---------------- HÀNH ĐỘNG ---------------- */}
        <button
          type="button"
          onClick={primary}
          disabled={!canSubmit || (checked && (saving || !!saveError))}
          className={cn(
            'press mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-card disabled:opacity-50',
            checked && !wasCorrect
              ? 'bg-slate-700 hover:bg-slate-800'
              : 'bg-violet-600 hover:bg-violet-700',
          )}
        >
          {checked && saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {isIntro
            ? 'Kiểm tra ngay từ này — Enter'
            : !checked
              ? 'Kiểm tra — Enter'
              : saving
                ? 'Đang lưu…'
                : 'Tiếp tục — Enter'}
        </button>
      </div>

      <p className="text-center text-xs text-slate-400">
        Câu hỏi được trộn lẫn giữa các từ đang học (tối đa {ACTIVE_LIMIT} từ một
        lúc). Dạng nào đã đúng thì không hỏi lại; từ chưa qua đủ {need} dạng sẽ
        được kiểm tra tiếp bằng các dạng khác cho tới khi đúng.
      </p>
    </div>
  )
}
