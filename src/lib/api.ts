import { getSupabase } from './supabase'
import type {
  Day,
  DaySummary,
  ExamContent,
  ExamMode,
  GrammarContent,
  OptionKey,
  PracticeContent,
  QuizQuestion,
  VocabCard,
  VocabStats,
  WordForm,
} from '../data/types'

// --- DB row shapes -----------------------------------------------------------

interface DayRow {
  id: number
  day_number: number
  week: number
  title: string
  type: DaySummary['type']
  duration: string | null
  exam_test_id: number | null
  exam_mode: 'listening' | 'reading' | 'full' | null
  review_of_day: number | null
}

interface QuizRow {
  id: number
  ord: number
  question_text: string
  option_a: string | null
  option_b: string | null
  option_c: string | null
  option_d: string | null
  correct_option: 'A' | 'B' | 'C' | 'D'
  explanation_text: string | null
  translation: string | null
  passage: string | null
  num_options: number | null
  image_url: string | null
}

interface CardRow {
  id: number
  word: string
  word_form: string
  ipa: string | null
  meaning: string
  example: string | null
  example_translation: string | null
  vocab_item_id?: number | null
}

// --- Mappers -----------------------------------------------------------------

function mapQuiz(r: QuizRow): QuizQuestion {
  return {
    id: String(r.id),
    ord: r.ord,
    question: r.question_text,
    options: {
      A: r.option_a ?? '',
      B: r.option_b ?? '',
      C: r.option_c ?? '',
      D: r.option_d ?? '',
    },
    correct: r.correct_option,
    explanation: r.explanation_text ?? '',
    translation: r.translation ?? undefined,
    passage: r.passage ?? undefined,
    numOptions: (r.num_options === 3 ? 3 : 4) as 3 | 4,
    imageUrl: r.image_url ?? undefined,
  }
}

function mapCard(r: CardRow): VocabCard {
  return {
    id: String(r.id),
    word: r.word,
    wordForm: r.word_form as WordForm,
    ipa: r.ipa ?? '',
    meaning: r.meaning,
    example: r.example ?? '',
    exampleTranslation: r.example_translation ?? '',
    vocabItemId: r.vocab_item_id ?? undefined,
  }
}

/** Maps a vocab_items row (the master pool) to a VocabCard. */
function mapVocabItem(r: CardRow): VocabCard {
  return {
    id: String(r.id),
    word: r.word,
    wordForm: r.word_form as WordForm,
    ipa: r.ipa ?? '',
    meaning: r.meaning,
    example: r.example ?? '',
    exampleTranslation: r.example_translation ?? '',
    vocabItemId: r.id,
  }
}

function mapSummary(r: DayRow): DaySummary {
  return {
    day: r.day_number,
    week: r.week,
    title: r.title,
    type: r.type,
    duration: r.duration ?? undefined,
  }
}

// --- Public API --------------------------------------------------------------

/** All 90 days (summaries) for the sidebar. */
export async function getDays(): Promise<DaySummary[]> {
  const { data, error } = await getSupabase()
    .from('days')
    .select('id, day_number, week, title, type, duration')
    .order('day_number', { ascending: true })

  if (error) throw new Error(error.message)
  return (data as DayRow[]).map(mapSummary)
}

/** One day with its full content payload (null content = not authored yet). */
export async function getDayDetail(dayNumber: number): Promise<Day> {
  const sb = getSupabase()

  const { data: dayData, error: dayErr } = await sb
    .from('days')
    .select(
      'id, day_number, week, title, type, duration, exam_test_id, exam_mode, review_of_day',
    )
    .eq('day_number', dayNumber)
    .single()

  if (dayErr) throw new Error(dayErr.message)
  const dayRow = dayData as DayRow
  const day: Day = mapSummary(dayRow)
  day.reviewOfDay = dayRow.review_of_day ?? undefined

  // Fetch every possible section for the day in parallel.
  const [glRes, quizRes, cardRes, ptRes] = await Promise.all([
    sb
      .from('grammar_lessons')
      .select('theory_markdown, tips')
      .eq('day_id', dayRow.id)
      .maybeSingle(),
    sb
      .from('quiz_questions')
      .select(
        'id, ord, question_text, option_a, option_b, option_c, option_d, correct_option, explanation_text, translation, passage, num_options, image_url',
      )
      .eq('day_id', dayRow.id)
      .order('ord', { ascending: true }),
    sb
      .from('vocabulary_flashcards')
      .select(
        'id, word, word_form, ipa, meaning, example, example_translation, vocab_item_id',
      )
      .eq('day_id', dayRow.id)
      .order('ord', { ascending: true }),
    sb
      .from('practice_tests')
      .select('duration_minutes, audio_url, pdf_url, is_listening')
      .eq('day_id', dayRow.id)
      .maybeSingle(),
  ])
  if (quizRes.error) throw new Error(quizRes.error.message)
  if (cardRes.error) throw new Error(cardRes.error.message)

  const quiz = ((quizRes.data as QuizRow[]) ?? []).map(mapQuiz)
  const cards = ((cardRes.data as CardRow[]) ?? []).map(mapCard)
  const lesson = glRes.data as { theory_markdown: string; tips: string[] } | null

  // Vocabulary section (any day can have one).
  if (cards.length > 0) day.vocabulary = cards

  // Grammar section — its quiz_questions belong to the grammar quiz.
  if (lesson) {
    const grammar: GrammarContent = {
      theoryMarkdown: lesson.theory_markdown ?? '',
      tips: lesson.tips ?? [],
      quiz,
    }
    day.grammar = grammar
  }

  // Exam (full ETS test) OR mini-test practice section.
  if (dayRow.exam_test_id) {
    day.exam = await loadExamContent(
      dayRow.exam_test_id,
      dayRow.exam_mode ?? 'full',
    )
  } else if (!lesson && (ptRes.data || quiz.length > 0)) {
    const test = ptRes.data as {
      duration_minutes: number
      audio_url: string | null
      pdf_url: string | null
      is_listening: boolean | null
    } | null
    const practice: PracticeContent = {
      durationMinutes: test?.duration_minutes ?? 20,
      questions: quiz,
      audioUrl: test?.audio_url ?? undefined,
      pdfUrl: test?.pdf_url ?? undefined,
      listening: test?.is_listening ?? false,
    }
    day.practice = practice
  }

  return day
}

interface ExamTestRow {
  code: string
  title: string
  listening_pdf_path: string | null
  reading_pdf_path: string | null
  audio_path: string | null
  listening_minutes: number
  reading_minutes: number
}

interface ExamQuestionRow {
  q_number: number
  part: number
  correct_option: 'A' | 'B' | 'C' | 'D'
  num_options: number
}

async function loadExamContent(
  examTestId: number,
  mode: ExamMode,
): Promise<ExamContent> {
  const sb = getSupabase()
  const [{ data: test, error: tErr }, { data: qs, error: qErr }] =
    await Promise.all([
      sb
        .from('exam_tests')
        .select(
          'code, title, listening_pdf_path, reading_pdf_path, audio_path, listening_minutes, reading_minutes',
        )
        .eq('id', examTestId)
        .single(),
      sb
        .from('exam_questions')
        .select('q_number, part, correct_option, num_options')
        .eq('exam_test_id', examTestId)
        .order('q_number', { ascending: true }),
    ])
  if (tErr) throw new Error(tErr.message)
  if (qErr) throw new Error(qErr.message)

  const t = test as ExamTestRow
  const publicUrl = (path: string | null): string | undefined =>
    path ? sb.storage.from('ets-files').getPublicUrl(path).data.publicUrl : undefined

  return {
    kind: 'exam',
    code: t.code,
    title: t.title,
    mode,
    listeningPdfUrl: publicUrl(t.listening_pdf_path),
    readingPdfUrl: publicUrl(t.reading_pdf_path),
    audioUrl: publicUrl(t.audio_path),
    listeningMinutes: t.listening_minutes,
    readingMinutes: t.reading_minutes,
    answers: (qs as ExamQuestionRow[]).map((q) => ({
      qNumber: q.q_number,
      part: q.part,
      correct: q.correct_option,
      numOptions: (q.num_options === 3 ? 3 : 4) as 3 | 4,
    })),
  }
}

// --- Wrong-answer review (AI) ------------------------------------------------

export interface ExamAnswerKey {
  code: string
  title: string
  answers: {
    qNumber: number
    part: number
    correct: OptionKey
    numOptions: 3 | 4
  }[]
}

/** Answer key + metadata of the ETS test linked to a given day (for review). */
export async function fetchExamKeyForDay(
  dayNumber: number,
): Promise<ExamAnswerKey | null> {
  const sb = getSupabase()
  const { data: dayData } = await sb
    .from('days')
    .select('exam_test_id')
    .eq('day_number', dayNumber)
    .single()
  const examTestId = (dayData as { exam_test_id: number | null } | null)
    ?.exam_test_id
  if (!examTestId) return null

  const [{ data: test, error: tErr }, { data: qs, error: qErr }] =
    await Promise.all([
      sb.from('exam_tests').select('code, title').eq('id', examTestId).single(),
      sb
        .from('exam_questions')
        .select('q_number, part, correct_option, num_options')
        .eq('exam_test_id', examTestId)
        .order('q_number', { ascending: true }),
    ])
  if (tErr) throw new Error(tErr.message)
  if (qErr) throw new Error(qErr.message)

  const t = test as { code: string; title: string }
  return {
    code: t.code,
    title: t.title,
    answers: (qs as ExamQuestionRow[]).map((q) => ({
      qNumber: q.q_number,
      part: q.part,
      correct: q.correct_option,
      numOptions: (q.num_options === 3 ? 3 : 4) as 3 | 4,
    })),
  }
}

/** Calls the `review-mistakes` edge function (AI). Returns its JSON payload. */
export async function reviewMistakes(
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const { data, error } = await getSupabase().functions.invoke(
    'review-mistakes',
    { body },
  )
  if (error) throw new Error(error.message)
  return data as Record<string, unknown>
}

// --- Standalone vocabulary review (global pool + per-user mastery) -----------

/** Overall mastery stats for the signed-in user. */
export async function getVocabStats(): Promise<VocabStats> {
  const { data, error } = await getSupabase().rpc('get_vocab_stats')
  if (error) throw new Error(error.message)
  const d = (data ?? {}) as Partial<VocabStats>
  return {
    total: d.total ?? 0,
    started: d.started ?? 0,
    learning: d.learning ?? 0,
    mastered: d.mastered ?? 0,
    due: d.due ?? 0,
  }
}

/** Words the user has never studied (random sample). */
export async function getNewVocab(limit: number): Promise<VocabCard[]> {
  const { data, error } = await getSupabase().rpc('get_new_vocab', {
    p_limit: limit,
  })
  if (error) throw new Error(error.message)
  return ((data as CardRow[]) ?? []).map(mapVocabItem)
}

/** Words the user has started but not yet mastered (least-recently reviewed). */
export async function getReviewVocab(limit: number): Promise<VocabCard[]> {
  const { data, error } = await getSupabase().rpc('get_review_vocab', {
    p_limit: limit,
  })
  if (error) throw new Error(error.message)
  return ((data as CardRow[]) ?? []).map(mapVocabItem)
}

/** Persist a batch of quiz results ([{ id: vocabItemId, correct }]). */
export async function recordVocabResults(
  results: { id: number; correct: boolean }[],
): Promise<void> {
  if (results.length === 0) return
  const { error } = await getSupabase().rpc('record_vocab_results', {
    p_results: results,
  })
  if (error) throw new Error(error.message)
}
