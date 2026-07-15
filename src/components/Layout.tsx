import { useState, type ReactNode } from 'react'
import {
  BookMarked,
  BookOpenCheck,
  GraduationCap,
  Headphones,
  Menu,
  X,
} from 'lucide-react'
import { ProgressBar } from './ProgressBar'
import { Sidebar } from './sidebar/Sidebar'
import { UserMenu } from '../auth/UserMenu'
import { TOTAL_DAYS } from '../data/constants'
import type { DaySummary } from '../data/types'
import type { UseProgress } from '../hooks/useProgress'

interface LayoutProps {
  days: DaySummary[]
  daysLoading: boolean
  daysError: string | null
  progress: UseProgress
  selectedDay: number
  onSelectDay: (day: number) => void
  onOpenVocab: () => void
  onOpenDictation: () => void
  onOpenReading: () => void
  children: ReactNode
}

export function Layout({
  days,
  daysLoading,
  daysError,
  progress,
  selectedDay,
  onSelectDay,
  onOpenVocab,
  onOpenDictation,
  onOpenReading,
  children,
}: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSelect = (day: number) => {
    onSelectDay(day)
    setMobileOpen(false)
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      {/* Header */}
      <header className="z-20 shrink-0 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="press grid h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Mở danh sách ngày học"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-card">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <h1 className="text-sm font-bold text-slate-900 sm:text-base">
                Lộ trình 90 ngày đạt TOEIC 650+
              </h1>
              <p className="hidden text-xs text-slate-500 sm:block">
                Học ngữ pháp · Từ vựng · Luyện đề
              </p>
            </div>
          </div>

          <div className="ml-auto hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={onOpenDictation}
              className="press inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100"
            >
              <Headphones className="h-4 w-4" />
              Chép chính tả
            </button>
            <button
              type="button"
              onClick={onOpenVocab}
              className="press inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-100"
            >
              <BookMarked className="h-4 w-4" />
              Ôn từ vựng
            </button>
            <button
              type="button"
              onClick={onOpenReading}
              className="press inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100"
            >
              <BookOpenCheck className="h-4 w-4" />
              Ôn Reading
            </button>
            <div className="w-40">
              <ProgressBar
                value={progress.completionPct}
                doneCount={progress.doneCount}
                total={TOTAL_DAYS}
                loading={progress.loading}
              />
            </div>
            <UserMenu />
          </div>

          {/* Dictation + vocab + user menu (mobile) */}
          <div className="ml-auto flex items-center gap-1.5 md:hidden">
            <button
              type="button"
              onClick={onOpenDictation}
              aria-label="Nghe chép chính tả"
              className="press grid h-9 w-9 place-items-center rounded-lg border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
            >
              <Headphones className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onOpenVocab}
              aria-label="Ôn từ vựng"
              className="press grid h-9 w-9 place-items-center rounded-lg border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
            >
              <BookMarked className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onOpenReading}
              aria-label="Ôn Reading"
              className="press grid h-9 w-9 place-items-center rounded-lg border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
            >
              <BookOpenCheck className="h-4 w-4" />
            </button>
            <UserMenu compact />
          </div>
        </div>

        {/* Progress bar (mobile) */}
        <div className="px-4 pb-3 md:hidden">
          <ProgressBar
            value={progress.completionPct}
            doneCount={progress.doneCount}
            total={TOTAL_DAYS}
            loading={progress.loading}
          />
        </div>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        {/* Desktop sidebar */}
        <aside className="thin-scrollbar hidden w-80 shrink-0 overflow-y-auto border-r border-slate-200 bg-white lg:block">
          <Sidebar
            days={days}
            loading={daysLoading}
            error={daysError}
            selectedDay={selectedDay}
            onSelectDay={handleSelect}
            progress={progress}
          />
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-slate-900/40 animate-fade-in"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <div className="thin-scrollbar absolute left-0 top-0 h-full w-80 max-w-[85%] overflow-y-auto bg-white shadow-card-lg animate-fade-slide-left">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <span className="text-sm font-semibold text-slate-700">
                  Danh sách ngày học
                </span>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="press grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                  aria-label="Đóng"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <Sidebar
                days={days}
                loading={daysLoading}
                error={daysError}
                selectedDay={selectedDay}
                onSelectDay={handleSelect}
                progress={progress}
              />
            </div>
          </div>
        )}

        {/* Main workspace */}
        <main className="thin-scrollbar min-w-0 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
