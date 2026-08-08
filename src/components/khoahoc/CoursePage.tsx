import { useCallback, useEffect, useState } from 'react'
import { Compass, ListTree, Loader2, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { SectionNav } from '../common/SectionNav'
import type { AppView } from '../../lib/views'
import { UserMenu } from '../../auth/UserMenu'
import { CourseOutline } from './CourseOutline'
import { LessonView } from './LessonView'
import { getCourseLesson, getCourseOutline, type CourseLesson, type CourseOutline as COutline } from '../../lib/courseApi'

function firstLessonKey(o: COutline): string | null {
  for (const s of o.sections) if (s.lessons.length) return s.lessons[0].key
  return null
}

export function CoursePage({ onNavigate }: { onNavigate: (v: AppView) => void }) {
  const [outline, setOutline] = useState<COutline | null>(null)
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [lesson, setLesson] = useState<CourseLesson | null>(null)
  const [lessonLoading, setLessonLoading] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const loadOutline = useCallback(async () => {
    try {
      const o = await getCourseOutline()
      setOutline(o)
      setActiveKey((prev) => prev ?? firstLessonKey(o))
      setErr(null)
    } catch (e) {
      setErr((e as Error).message)
    }
  }, [])

  useEffect(() => {
    void loadOutline()
  }, [loadOutline])

  useEffect(() => {
    if (!activeKey) return
    setLessonLoading(true)
    getCourseLesson(activeKey)
      .then(setLesson)
      .catch(() => {})
      .finally(() => setLessonLoading(false))
  }, [activeKey])

  const pick = (k: string) => {
    setActiveKey(k)
    setDrawer(false)
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      {/* Header */}
      <header className="z-20 shrink-0 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-card">
              <Compass className="h-5 w-5" />
            </div>
            <h1 className="text-sm font-bold text-slate-900 sm:text-base">Khóa học TOEIC</h1>
          </div>
          {outline && (
            <span className="ml-auto hidden text-xs font-semibold text-slate-500 sm:block">
              {outline.doneLessons}/{outline.totalLessons} bài học
            </span>
          )}
          <div className="ml-auto sm:ml-2">
            <UserMenu />
          </div>
        </div>
        <div className="border-t border-slate-100 px-4 pb-2.5 lg:px-6">
          <SectionNav current="khoahoc" onNavigate={onNavigate} />
        </div>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        {/* Outline cố định (màn hình lớn) */}
        <aside className="thin-scrollbar hidden w-80 shrink-0 overflow-y-auto border-r border-slate-200 bg-white lg:block">
          {outline && <CourseOutline outline={outline} activeKey={activeKey} onPick={pick} />}
        </aside>

        {/* Drawer mục lục (điện thoại / iPad dọc) */}
        {drawer && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-slate-900/40 animate-fade-in" onClick={() => setDrawer(false)} aria-hidden="true" />
            <div className="thin-scrollbar absolute left-0 top-0 h-full w-80 max-w-[85%] overflow-y-auto bg-white shadow-card-lg animate-fade-slide-left">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <span className="text-sm font-semibold text-slate-700">Mục lục khóa học</span>
                <button
                  type="button"
                  onClick={() => setDrawer(false)}
                  className="press grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                  aria-label="Đóng"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {outline && <CourseOutline outline={outline} activeKey={activeKey} onPick={pick} />}
            </div>
          </div>
        )}

        {/* Nội dung bài học */}
        <main className="thin-scrollbar min-w-0 flex-1 overflow-y-auto">
          {/* Thanh mở mục lục (điện thoại) */}
          <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-slate-200 bg-white/90 px-4 py-2 backdrop-blur lg:hidden">
            <button
              type="button"
              onClick={() => setDrawer(true)}
              className="press inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <ListTree className="h-4 w-4" /> Mục lục
            </button>
            {lesson && <span className="truncate text-sm font-semibold text-slate-700">{lesson.title}</span>}
          </div>

          <div className="px-4 py-6 lg:px-8">
            {err ? (
              <p className="mx-auto max-w-lg rounded-xl border border-rose-200 bg-rose-50 p-4 text-center text-sm text-rose-700">{err}</p>
            ) : !outline || (lessonLoading && !lesson) ? (
              <div className="flex items-center justify-center gap-2 py-20 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" /> Đang tải…
              </div>
            ) : outline.totalLessons === 0 ? (
              <p className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                Khóa học đang được cập nhật nội dung.
              </p>
            ) : lesson ? (
              <div className={cn(lessonLoading && 'opacity-60 transition-opacity')}>
                <LessonView lesson={lesson} onProgress={loadOutline} />
              </div>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  )
}
