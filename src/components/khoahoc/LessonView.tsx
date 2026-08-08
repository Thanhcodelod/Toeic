import { useEffect, useState } from 'react'
import { BookOpen, ClipboardCheck, Clock, Layers, Lightbulb, PencilLine, Sparkles, Zap, type LucideIcon } from 'lucide-react'
import { Tabs, type TabDef } from '../common/Tabs'
import { markCourseTab, TAB_LABEL, type CourseLesson, type TabId } from '../../lib/courseApi'
import { TheoryTab } from './tabs/TheoryTab'
import { ExamplesTab } from './tabs/ExamplesTab'
import { TipsTab } from './tabs/TipsTab'
import { VocabTab } from './tabs/VocabTab'
import { ExerciseTab } from './tabs/ExerciseTab'
import { QuizRunner } from './tabs/QuizRunner'

const TAB_ICON: Record<TabId, LucideIcon> = {
  theory: BookOpen,
  examples: Lightbulb,
  tips: Sparkles,
  vocab: Layers,
  exercises: PencilLine,
  quiz: Zap,
  test: ClipboardCheck,
}
const CONTENT_TABS: TabId[] = ['theory', 'examples', 'tips', 'vocab']

export function LessonView({ lesson, onProgress }: { lesson: CourseLesson; onProgress: () => void }) {
  const tabs = lesson.tabs
  const [active, setActive] = useState<TabId>(tabs[0] ?? 'theory')

  useEffect(() => {
    setActive(lesson.tabs[0] ?? 'theory')
  }, [lesson.key]) // eslint-disable-line react-hooks/exhaustive-deps

  // Đánh dấu đã xem các tab nội dung (không chấm điểm) để tính hoàn thành.
  useEffect(() => {
    if (CONTENT_TABS.includes(active)) {
      markCourseTab(lesson.key, active).then(onProgress).catch(() => {})
    }
  }, [lesson.key, active]) // eslint-disable-line react-hooks/exhaustive-deps

  const tabDefs: TabDef[] = tabs.map((t) => ({ id: t, label: TAB_LABEL[t], icon: TAB_ICON[t] }))

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-4">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{lesson.title}</h1>
        {lesson.subtitle && <p className="mt-0.5 text-sm text-slate-500">{lesson.subtitle}</p>}
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-400">
          <Clock className="h-3.5 w-3.5" /> ~{lesson.estMinutes} phút
        </p>
      </header>

      {tabDefs.length > 1 && (
        <div className="mb-4 overflow-x-auto pb-1">
          <Tabs tabs={tabDefs} active={active} onChange={(id) => setActive(id as TabId)} />
        </div>
      )}

      <div key={active} className="animate-fade-slide-up">
        {active === 'theory' && lesson.theory && <TheoryTab markdown={lesson.theory} />}
        {active === 'examples' && <ExamplesTab items={lesson.examples} />}
        {active === 'tips' && <TipsTab items={lesson.tips} />}
        {active === 'vocab' && <VocabTab items={lesson.vocab} />}
        {active === 'exercises' && <ExerciseTab lessonKey={lesson.key} items={lesson.exercises} />}
        {active === 'quiz' && <QuizRunner lessonKey={lesson.key} tab="quiz" items={lesson.quiz} onGraded={onProgress} />}
        {active === 'test' && <QuizRunner lessonKey={lesson.key} tab="test" items={lesson.test} onGraded={onProgress} />}
      </div>
    </div>
  )
}
