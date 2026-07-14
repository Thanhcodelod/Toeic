// ============================================================================
// Data types for the "Lộ trình 90 ngày đạt TOEIC 650+" module.
//
// Content is fetched from Supabase and mapped into these shapes (see lib/api.ts).
// The UI reads ONLY from these shapes, so the data source can change freely.
// ============================================================================

/** The three learning experiences a day can render. */
export type ContentType = 'grammar' | 'vocabulary' | 'practice'

/** A single answer option key. */
export type OptionKey = 'A' | 'B' | 'C' | 'D'

/** Word form tag shown on the front of a flashcard. */
export type WordForm =
  | 'n' // danh từ
  | 'v' // động từ
  | 'adj' // tính từ
  | 'adv' // trạng từ
  | 'prep' // giới từ
  | 'conj' // liên từ
  | 'phr' // cụm từ

/** A multiple-choice question (Part 5 grammar quiz OR a practice test item). */
export interface QuizQuestion {
  id: string
  /** Stable order within its day — the key used to persist answers server-side. */
  ord: number
  question: string
  options: Record<OptionKey, string>
  correct: OptionKey
  /** Detailed explanation (Vietnamese) shown after answering. */
  explanation: string
  /** Optional Vietnamese translation of the sentence/question. */
  translation?: string
  /** Optional shared reading passage (Part 6/7). Questions with the same
   *  passage are grouped under one passage block. */
  passage?: string
  /** Number of answer choices (3 for Part 2, otherwise 4). */
  numOptions?: 3 | 4
  /** Optional photo (TOEIC Part 1) — a free-license image. */
  imageUrl?: string
}

/** Content for a 'grammar' day. */
export interface GrammarContent {
  /** Rich theory rendered as Markdown (headings, tables, formulas, lists). */
  theoryMarkdown: string
  /** Highlighted TOEIC-tip callout boxes shown alongside the theory. */
  tips: string[]
  /** Interactive Part-5 style quiz. */
  quiz: QuizQuestion[]
}

/** A single vocabulary flashcard. */
export interface VocabCard {
  id: string
  word: string
  wordForm: WordForm
  /** IPA pronunciation, e.g. /əˈpruːv/ */
  ipa: string
  meaning: string
  /** High-frequency TOEIC example sentence (English). */
  example: string
  /** Vietnamese translation of the example sentence. */
  exampleTranslation: string
  /** Master-pool id (vocab_items.id) — used to persist review progress. */
  vocabItemId?: number
}

/** Aggregate vocabulary mastery for the current user. */
export interface VocabStats {
  /** Total unique words in the master pool. */
  total: number
  /** Words that graduated the 6-kind gate (level >= 1). */
  started: number
  /** Words mid-lesson: some kinds passed, not yet all 6. */
  learning: number
  /** Words at the top memory level (Thông thạo). */
  mastered: number
  /** Words whose spaced-repetition review is due now. */
  due: number
}

/** Content for a 'practice' (mini-test) day — question-based, no PDF required. */
export interface PracticeContent {
  /** Duration of the test in minutes (drives the countdown timer). */
  durationMinutes: number
  /** The mini-test questions + answer key + explanations. */
  questions: QuizQuestion[]
  /** Optional listening audio track URL (for listening sections). */
  audioUrl?: string
  /** Optional PDF sheet URL (only for full reading tests, if provided). */
  pdfUrl?: string
  /** When true, question passages are spoken scripts (played via TTS) and
   *  hidden until review — a listening test. */
  listening?: boolean
}

/** Section a full ETS test is run in. */
export type ExamMode = 'listening' | 'reading' | 'full'

/** One answer-key entry of a full ETS test (content is the scanned PDF). */
export interface ExamAnswerItem {
  qNumber: number
  /** TOEIC part 1–7. */
  part: number
  correct: OptionKey
  /** 3 for Part 2 (A/B/C), otherwise 4. */
  numOptions: 3 | 4
}

/** Content for a full ETS test day — image-based CBT (scanned đề + audio). */
export interface ExamContent {
  kind: 'exam'
  code: string
  title: string
  mode: ExamMode
  listeningPdfUrl?: string
  readingPdfUrl?: string
  audioUrl?: string
  listeningMinutes: number
  readingMinutes: number
  answers: ExamAnswerItem[]
}

/** The content payload for a day, discriminated by `Day.type`. */
export type DayContent =
  | GrammarContent
  | VocabCard[]
  | PracticeContent
  | ExamContent

/** Sidebar summary of a day (no content payload). */
export interface DaySummary {
  /** 1–90 */
  day: number
  /** 1–13 */
  week: number
  /** Vietnamese topic title, e.g. "Thì hiện tại đơn & tiếp diễn". */
  title: string
  type: ContentType
  /** Human-readable duration label, e.g. "2h". */
  duration?: string
}

/**
 * A day plus all its fetched content sections. A day can carry MORE than one
 * section (e.g. a "Luyện Part" day that also has a vocabulary section, or a
 * grammar day with an extra vocabulary list). Each section is optional.
 */
export interface Day extends DaySummary {
  grammar?: GrammarContent | null
  vocabulary?: VocabCard[] | null
  /** Question-based mini-test. */
  practice?: PracticeContent | null
  /** Full ETS test (image-based CBT). */
  exam?: ExamContent | null
  /** For a "Ôn tập câu sai" day: the day number of the test it reviews. */
  reviewOfDay?: number | null
}

/**
 * In a listening test, is this question "audio-only" — i.e. its answer choices
 * are SPOKEN (TOEIC Part 1 photo statements & Part 2 responses), not printed?
 * Such questions must show only the A/B/C/D bubbles until the test is submitted.
 * Part 3/4 print their questions & options, so they return false.
 */
export function isAudioOnlyListening(
  q: QuizQuestion,
  listening?: boolean,
): boolean {
  if (!listening) return false
  // Part 2: a prompt + 3 spoken responses (A/B/C).
  if (q.numOptions === 3) return true
  // Part 1: a photo + 4 spoken descriptive statements.
  if (q.imageUrl) return true
  const hay = `${q.passage ?? ''} ${q.question ?? ''}`.toLowerCase()
  return /part\s*1|photograph|mô tả tranh|bức ảnh|describes the picture|look at the picture/.test(
    hay,
  )
}

/** True if the day has any authored content section. */
export function dayHasContent(day: Day): boolean {
  return Boolean(
    day.grammar ||
      (day.vocabulary && day.vocabulary.length > 0) ||
      day.practice ||
      day.exam ||
      day.reviewOfDay,
  )
}

// --- Progress model ----------------------------------------------------------

/** Learning status of a day, mapped to a Vietnamese badge in the UI. */
export type DayStatus = 'not-started' | 'in-progress' | 'done'

/** Per-day progress persisted to Local Storage. */
export interface DayProgress {
  status: Exclude<DayStatus, 'not-started'>
  /** Best practice-test score as a percentage (0–100). */
  bestScorePct?: number
}

/** The full progress map: day number -> progress. */
export type ProgressMap = Record<number, DayProgress>
