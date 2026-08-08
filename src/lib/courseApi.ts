// "Khóa học TOEIC" — API đọc outline / bài học + chấm điểm phía server.
import { getSupabase } from './supabase'

async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await getSupabase().rpc(fn, args)
  if (error) throw new Error(error.message)
  return data as T
}

export type TabId = 'theory' | 'examples' | 'tips' | 'vocab' | 'exercises' | 'quiz' | 'test'

export interface OutlineLesson {
  key: string
  title: string
  subtitle: string | null
  estMinutes: number
  status: 'new' | 'in-progress' | 'done'
  quizBest: number | null
  tabs: TabId[]
}
export interface OutlineSection {
  key: string
  title: string
  subtitle: string | null
  icon: string | null
  color: string | null
  lessons: OutlineLesson[]
  total: number
  done: number
}
export interface CourseOutline {
  totalLessons: number
  doneLessons: number
  sections: OutlineSection[]
}

export interface Mcq {
  ord: number
  stem: string
  options: { A: string; B: string; C: string; D: string }
}
export interface Example {
  en: string
  vi: string
  analysis: string
}
export interface Tip {
  tip: string
  detail: string
}
export interface CourseVocab {
  word: string
  ipa: string
  wordForm: string
  meaning: string
  example: string
  exampleVi: string
}
export interface LessonProgress {
  viewedTabs?: string[]
  quizBest?: number | null
  testBest?: number | null
  exercisesDone?: number
  status?: 'new' | 'in-progress' | 'done'
}
export interface CourseLesson {
  key: string
  sectionKey: string
  title: string
  subtitle: string | null
  estMinutes: number
  theory: string | null
  examples: Example[]
  tips: Tip[]
  vocab: CourseVocab[]
  exercises: Mcq[]
  quiz: Mcq[]
  test: Mcq[]
  tabs: TabId[]
  progress: LessonProgress
}

export interface AnswerResult {
  correct: boolean
  correctOption: string
  explanation: string
}
export interface TestReviewRow {
  ord: number
  chosen: string | null
  correct: string
  ok: boolean
  explanation: string
}
export interface TestResult {
  score: number
  correctCount: number
  total: number
  review: TestReviewRow[]
}

export const getCourseOutline = () => rpc<CourseOutline>('get_course_outline')

export const getCourseLesson = (key: string) => rpc<CourseLesson | null>('get_course_lesson', { p_key: key })

export const answerCourseItem = (lesson: string, tab: TabId, ord: number, chosen: string) =>
  rpc<AnswerResult>('answer_course_item', { p_lesson: lesson, p_tab: tab, p_ord: ord, p_chosen: chosen })

export const submitCourseTest = (lesson: string, tab: 'quiz' | 'test', answers: Record<string, string>) =>
  rpc<TestResult>('submit_course_test', { p_lesson: lesson, p_tab: tab, p_answers: answers })

export const markCourseTab = (lesson: string, tab: TabId) =>
  rpc<LessonProgress>('mark_course_tab', { p_lesson: lesson, p_tab: tab })

export const TAB_LABEL: Record<TabId, string> = {
  theory: 'Lý thuyết',
  examples: 'Ví dụ',
  tips: 'Mẹo',
  vocab: 'Từ vựng',
  exercises: 'Bài tập',
  quiz: 'Quiz',
  test: 'Đề thi',
}
