// Bài học từ vựng kiểu Lingoland: HỌC XEN KẼ KIỂM TRA, TRỘN LẪN CÁC TỪ.
//
// Cổng của một từ:
//   Chưa học (0) --[trả lời ĐÚNG 6 DẠNG câu hỏi khác nhau]--> Mới học (1)
//
// NHỊP HỌC (một "vòng"):
//   học 2 từ mới → 2–3 câu hỏi → học 2 từ mới → 2–3 câu hỏi → …
//   Câu hỏi được RÚT NGẪU NHIÊN CÓ TRỌNG SỐ từ TẤT CẢ các từ đang học dở, không
//   phải chỉ 2 từ vừa học — từ mới (còn nhiều dạng chưa qua) có xác suất cao hơn,
//   nhưng từ cũ vẫn quay lại đều. Trộn lẫn như vậy mới nhớ lâu.
//   Số từ "đang trong tay" (đã học, chưa qua) tối đa ACTIVE_LIMIT để không quá tải.
//
// • Một DẠNG đã trả lời đúng thì KHÔNG hỏi lại (kinds_ok lưu ở DB).
// • Trả lời sai một dạng -> dạng đó bị gỡ khỏi kinds_ok, và từ đó được kiểm tra
//   bằng DẠNG KHÁC trước khi dạng vừa sai quay lại.
// • Chỉ khi CẢ 20 từ đều qua đủ 6 dạng thì bài học mới được hoàn thành.
//
// Các cấp 2–5 (Nhớ tạm → Thông thạo) KHÔNG lên trong bài học; chúng lên dần qua
// các phiên ôn tập ngắt quãng ở mục "Ôn từ vựng" (2 giờ / 2 / 3 / 5 / 8 ngày).

import type { VocabCard } from '../data/types'

export type VocabLevel = 0 | 1 | 2 | 3 | 4 | 5

export const MAX_LEVEL: VocabLevel = 5
/** Số DẠNG câu hỏi phải trả lời đúng để một từ tốt nghiệp (khớp vocab_lesson_checks() ở SQL). */
export const LESSON_CHECKS = 6
/** Số từ mới được giới thiệu mỗi vòng. */
export const INTRO_BATCH = 2
/** Số câu hỏi xen giữa hai lần học từ mới (2–3 câu). */
export const CHECKS_MIN = 2
export const CHECKS_MAX = 3
/** Tối đa bao nhiêu từ được "mở" cùng lúc (đã học, chưa qua đủ 6 dạng). */
export const ACTIVE_LIMIT = 6

export const LEVEL_NAME: Record<VocabLevel, string> = {
  0: 'Chưa học',
  1: 'Mới học',
  2: 'Nhớ tạm',
  3: 'Nhớ lâu',
  4: 'Thuộc lòng',
  5: 'Thông thạo',
}

/** Bao lâu nữa gặp lại từ (khớp vocab_interval() ở SQL). */
export const LEVEL_INTERVAL: Record<VocabLevel, string> = {
  0: '—',
  1: '2 giờ',
  2: '2 ngày',
  3: '3 ngày',
  4: '5 ngày',
  5: '8 ngày',
}

export type ExerciseKind =
  | 'tf' // đúng/sai
  | 'word-meaning' // nhìn từ → chọn nghĩa
  | 'listen-meaning' // nghe → chọn nghĩa
  | 'meaning-word' // nhìn nghĩa → chọn từ
  | 'cloze' // điền từ vào câu
  | 'type' // nhìn nghĩa → viết lại từ
  | 'listen-type' // nghe → viết lại từ

export type StepKind = 'intro' | ExerciseKind

/** Thứ tự phục vụ: dễ → khó. */
export const KIND_ORDER: ExerciseKind[] = [
  'tf',
  'word-meaning',
  'listen-meaning',
  'meaning-word',
  'cloze',
  'type',
  'listen-type',
]

const NEEDS_SPEECH: ExerciseKind[] = ['listen-meaning', 'listen-type']

export const STEP_LABEL: Record<StepKind, string> = {
  intro: 'Từ mới',
  tf: 'Đúng hay sai?',
  'word-meaning': 'Chọn nghĩa',
  'listen-meaning': 'Nghe và chọn nghĩa',
  'meaning-word': 'Chọn từ',
  cloze: 'Điền từ vào câu',
  type: 'Viết lại từ',
  'listen-type': 'Nghe và viết lại từ',
}

export interface SessionStep {
  card: VocabCard
  kind: StepKind
  options: string[]
  /** Đáp án đúng (hoặc chính từ đó, với các dạng gõ). */
  answer: string
  /** đúng/sai: nghĩa đang được gán cho từ (có thể là nghĩa của từ khác). */
  tfMeaning?: string
  tfWordForm?: string
  /** cloze: câu ví dụ đã khoét chỗ trống. */
  cloze?: string
  /** Loại từ hiển thị trước mỗi nghĩa ở các phương án trắc nghiệm. */
  optionForms?: Record<string, string>
}

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

export function blankWord(sentence: string, word: string): string | null {
  const esc = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  if (!new RegExp(`\\b${esc}\\b`, 'i').test(sentence)) return null
  return sentence.replace(new RegExp(`\\b${esc}\\b`, 'ig'), '______')
}

/**
 * Các dạng câu hỏi thực sự phục vụ được cho một từ.
 * `cloze` chỉ dùng được khi từ xuất hiện nguyên dạng trong câu ví dụ (60/651 từ
 * dùng dạng chia nên không khoét được); các dạng nghe cần trình duyệt có
 * speechSynthesis. 6 dạng còn lại luôn dùng được.
 */
export function availableKinds(card: VocabCard, canSpeak: boolean): ExerciseKind[] {
  return KIND_ORDER.filter((k) => {
    if (k === 'cloze') return !!card.example && blankWord(card.example, card.word) !== null
    if (NEEDS_SPEECH.includes(k)) return canSpeak
    return true
  })
}

/** Số dạng phải qua cho từ này (khớp cách kẹp [4..6] của SQL). */
export function requiredChecks(card: VocabCard, canSpeak: boolean): number {
  return Math.min(LESSON_CHECKS, Math.max(4, availableKinds(card, canSpeak).length))
}

/** Dựng câu hỏi cụ thể. */
export function buildStep(
  card: VocabCard,
  kind: StepKind,
  pool: VocabCard[],
): SessionStep {
  const base = { card, kind } as const
  const others = pool.filter((c) => c.id !== card.id)

  if (kind === 'intro' || kind === 'type' || kind === 'listen-type')
    return { ...base, options: [], answer: card.word }

  if (kind === 'tf') {
    const decoy = others.length ? pick(others) : null
    const showTrue = !decoy || Math.random() < 0.5
    const shown = showTrue ? card : decoy
    return {
      ...base,
      options: ['Sai', 'Đúng'], // thứ tự khớp phím 1 / 2
      answer: showTrue ? 'Đúng' : 'Sai',
      tfMeaning: shown.meaning,
      tfWordForm: shown.wordForm,
    }
  }

  if (kind === 'cloze') {
    const blanked = card.example ? blankWord(card.example, card.word) : null
    if (!blanked) return buildStep(card, 'meaning-word', pool)
    const wrong = shuffle(others).slice(0, 3).map((c) => c.word)
    return {
      ...base,
      options: shuffle([card.word, ...wrong]),
      answer: card.word,
      cloze: blanked,
    }
  }

  if (kind === 'meaning-word') {
    const wrong = shuffle(others).slice(0, 3).map((c) => c.word)
    return { ...base, options: shuffle([card.word, ...wrong]), answer: card.word }
  }

  // word-meaning / listen-meaning → phương án là các NGHĨA (kèm loại từ)
  const decoys = shuffle(others).slice(0, 3)
  const optionForms: Record<string, string> = { [card.meaning]: card.wordForm }
  for (const d of decoys) optionForms[d.meaning] = d.wordForm
  return {
    ...base,
    options: shuffle([card.meaning, ...decoys.map((d) => d.meaning)]),
    answer: card.meaning,
    optionForms,
  }
}

// ---------------------------------------------------------------------------
// Bộ lập lịch
// ---------------------------------------------------------------------------

export interface Plan {
  card: VocabCard
  kind: StepKind
}

export interface WordState {
  /** Các dạng đã trả lời ĐÚNG (đọc từ DB, không hỏi lại). */
  kinds: ExerciseKind[]
  level: VocabLevel
}

export interface SchedulerState {
  words: Record<string, WordState>
  introduced: Set<string>
  lastCardId: string | null
  /** Dạng vừa hỏi cho mỗi từ — để không hỏi lại y hệt ngay lập tức. */
  lastKind: Record<string, ExerciseKind>
  canSpeak: boolean
  /** Còn bao nhiêu từ mới phải giới thiệu trong vòng hiện tại. */
  introLeft: number
  /** Còn bao nhiêu câu hỏi trong vòng hiện tại. */
  checksLeft: number
}

export function initScheduler(
  cards: VocabCard[],
  words: Record<string, WordState>,
  canSpeak: boolean,
): SchedulerState {
  const introduced = new Set<string>()
  // Từ đã gặp trước đây (đã có tiến trình) thì không cần thẻ "làm quen" nữa.
  for (const c of cards) {
    const w = words[c.id]
    if (w && (w.level > 0 || w.kinds.length > 0)) introduced.add(c.id)
  }
  return {
    words,
    introduced,
    lastCardId: null,
    lastKind: {},
    canSpeak,
    introLeft: 0,
    checksLeft: 0,
  }
}

export const checksOf = (st: SchedulerState, id: string): number =>
  st.words[id]?.kinds.length ?? 0

/**
 * Từ đã "qua" bài học -> không kiểm tra lại.
 *
 * CHỈ dựa vào `level` — tức là dựa vào SERVER. Không tự suy ra từ số dạng đã qua:
 * `requiredChecks` phụ thuộc thiết bị (có phát âm được không, có cloze không), nên
 * nếu client tự phán "đủ rồi" thì một từ có thể được coi là xong ở máy này trong
 * khi DB vẫn để level 0 — từ đó kẹt vĩnh viễn, không bao giờ vào lịch ôn.
 * Bài học vẫn chạy mượt vì answer_vocab_check tốt nghiệp từ ngay ở câu cuối và
 * client cập nhật level theo phản hồi của server.
 */
export function isPassed(card: VocabCard, st: SchedulerState): boolean {
  return (st.words[card.id]?.level ?? 0) > 0
}

/** Những từ chưa qua đủ số dạng. */
export const remaining = (cards: VocabCard[], st: SchedulerState): VocabCard[] =>
  cards.filter((c) => !isPassed(c, st))

/** Dạng kế tiếp cho một từ: dạng CHƯA qua, dễ trước khó sau, không lặp lại ngay. */
function nextKind(card: VocabCard, st: SchedulerState): ExerciseKind {
  const pool = availableKinds(card, st.canSpeak)
  const passed = st.words[card.id]?.kinds ?? []
  let todo = pool.filter((k) => !passed.includes(k))
  if (todo.length === 0) todo = pool // an toàn: không bao giờ kẹt
  if (todo.length > 1) {
    const last = st.lastKind[card.id]
    const alt = todo.filter((k) => k !== last)
    if (alt.length > 0) todo = alt
  }
  return todo[0]
}

/** Những từ ĐANG HỌC DỞ: đã gặp mặt nhưng chưa qua đủ dạng. */
export const activeWords = (cards: VocabCard[], st: SchedulerState): VocabCard[] =>
  remaining(cards, st).filter((c) => st.introduced.has(c.id))

/** Những từ chưa gặp mặt lần nào. */
const freshWords = (cards: VocabCard[], st: SchedulerState): VocabCard[] =>
  cards.filter((c) => !st.introduced.has(c.id) && !isPassed(c, st))

/**
 * Chọn từ để hỏi trong số các từ đang học dở — NGẪU NHIÊN CÓ TRỌNG SỐ:
 * còn càng nhiều dạng chưa qua thì càng dễ được gọi (từ vừa học có trọng số 6,
 * từ sắp xong chỉ còn 1) — nên từ mới được luyện ngay mà từ cũ vẫn quay lại đều.
 * Không bao giờ hỏi cùng một từ hai câu liên tiếp (khi còn từ khác).
 */
function pickWord(active: VocabCard[], st: SchedulerState): VocabCard {
  let pool = active
  if (pool.length > 1 && st.lastCardId) {
    const alt = pool.filter((c) => c.id !== st.lastCardId)
    if (alt.length > 0) pool = alt
  }
  const weights = pool.map((c) =>
    Math.max(1, requiredChecks(c, st.canSpeak) - checksOf(st, c.id)),
  )
  let r = Math.random() * weights.reduce((a, b) => a + b, 0)
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i]
    if (r <= 0) return pool[i]
  }
  return pool[pool.length - 1]
}

const roundChecks = (): number =>
  CHECKS_MIN + Math.floor(Math.random() * (CHECKS_MAX - CHECKS_MIN + 1))

/**
 * Việc tiếp theo, hoặc null khi mọi từ đã qua đủ dạng.
 *
 * Một vòng = giới thiệu 2 từ mới, rồi 2–3 câu hỏi rút từ TẤT CẢ các từ đang học
 * dở (trộn từ mới với từ cũ). Chỉ mở thêm từ mới khi số từ đang dở còn chỗ
 * (<= ACTIVE_LIMIT). Từ đã qua đủ 6 dạng thì không bao giờ xuất hiện lại.
 */
export function nextPlan(cards: VocabCard[], st: SchedulerState): Plan | null {
  if (remaining(cards, st).length === 0) return null

  // 1) Còn từ mới phải giới thiệu trong vòng này?
  if (st.introLeft > 0) {
    const fresh = freshWords(cards, st)
    if (fresh.length > 0) {
      st.introLeft -= 1
      return { card: fresh[0], kind: 'intro' }
    }
    st.introLeft = 0
  }

  const active = activeWords(cards, st)

  // 2) Còn câu hỏi trong vòng này?
  if (st.checksLeft > 0 && active.length > 0) {
    st.checksLeft -= 1
    const card = pickWord(active, st)
    return { card, kind: nextKind(card, st) }
  }

  // 3) Sang vòng mới -------------------------------------------------------
  const fresh = freshWords(cards, st)
  const room = active.length + INTRO_BATCH <= ACTIVE_LIMIT
  st.checksLeft = roundChecks()

  if (fresh.length > 0 && (room || active.length === 0)) {
    st.introLeft = Math.min(INTRO_BATCH, fresh.length) - 1
    return { card: fresh[0], kind: 'intro' }
  }

  // Hết chỗ (hoặc hết từ mới) -> chỉ kiểm tra, tiếp tục trộn.
  st.checksLeft -= 1
  const card = pickWord(active, st)
  return { card, kind: nextKind(card, st) }
}

/** Ghi nhận đã hỏi (để không lặp) — gọi ngay khi dựng xong câu hỏi. */
export function markAsked(st: SchedulerState, plan: Plan): void {
  if (plan.kind === 'intro') {
    st.introduced.add(plan.card.id)
    return
  }
  st.lastCardId = plan.card.id
  st.lastKind[plan.card.id] = plan.kind as ExerciseKind
}

export const normalizeWord = (s: string): string =>
  s.toLowerCase().replace(/[‘’]/g, "'").replace(/[^a-z'-]/g, '').trim()

export const isTypedCorrect = (typed: string, expected: string): boolean => {
  const t = normalizeWord(typed)
  return t.length > 0 && t === normalizeWord(expected)
}
