import { useState, type ReactNode } from 'react'
import {
  BookMarked,
  BookOpenCheck,
  GraduationCap,
  ListChecks,
  BarChart3,
  ClipboardCheck,
  Compass,
  Headphones,
  PenLine,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react'
import { cn } from '../lib/cn'
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
  onOpenParts: () => void
  onOpenStats: () => void
  onOpenMock: () => void
  onOpenOutput: () => void
  onOpenCourse: () => void
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
  onOpenParts,
  onOpenStats,
  onOpenMock,
  onOpenOutput,
  onOpenCourse,
  children,
}: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  // Sidebar cố định (màn hình lớn) có thể đóng/mở. Mặc định MỞ trên desktop rộng,
  // THU GỌN trên iPad (≥lg nhưng <xl) để nội dung chiếm trọn khung hình.
  const [railOpen, setRailOpen] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1280,
  )

  const handleSelect = (day: number) => {
    onSelectDay(day)
    setMobileOpen(false)
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      {/* Header */}
      <header className="z-20 shrink-0 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
          {/* Mở drawer (điện thoại / iPad dọc) */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="press grid h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Mở danh sách ngày học"
          >
            <Menu className="h-5 w-5" />
          </button>
          {/* Đóng/mở sidebar (màn hình lớn / iPad ngang) */}
          <button
            type="button"
            onClick={() => setRailOpen((o) => !o)}
            className="press hidden h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 lg:grid"
            aria-label={railOpen ? 'Ẩn danh sách ngày học' : 'Hiện danh sách ngày học'}
            title={railOpen ? 'Ẩn danh sách ngày' : 'Hiện danh sách ngày'}
          >
            {railOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeftOpen className="h-5 w-5" />
            )}
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

          <div className="ml-auto hidden items-center gap-2 xl:flex">
            <button
              type="button"
              onClick={onOpenCourse}
              className="press inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-100"
            >
              <Compass className="h-4 w-4" />
              Khóa học
            </button>
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
            <button
              type="button"
              onClick={onOpenParts}
              className="press inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
            >
              <ListChecks className="h-4 w-4" />
              Ôn Part 1–7
            </button>
            <button
              type="button"
              onClick={onOpenStats}
              className="press inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
            >
              <BarChart3 className="h-4 w-4" />
              Thống kê
            </button>
            <button
              type="button"
              onClick={onOpenMock}
              className="press inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
            >
              <ClipboardCheck className="h-4 w-4" />
              Đề mô phỏng
            </button>
            <button
              type="button"
              onClick={onOpenOutput}
              className="press inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100"
            >
              <PenLine className="h-4 w-4" />
              Nói &amp; Viết
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

          {/* Nút gọn (icon) — điện thoại + iPad, tới trước cỡ desktop lớn */}
          <div className="ml-auto flex items-center gap-1.5 xl:hidden">
            <button
              type="button"
              onClick={onOpenCourse}
              aria-label="Khóa học TOEIC"
              className="press grid h-9 w-9 place-items-center rounded-lg border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100"
            >
              <Compass className="h-4 w-4" />
            </button>
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
            <button
              type="button"
              onClick={onOpenParts}
              aria-label="Ôn Part 1–7"
              className="press grid h-9 w-9 place-items-center rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
            >
              <ListChecks className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onOpenStats}
              aria-label="Thống kê"
              className="press grid h-9 w-9 place-items-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            >
              <BarChart3 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onOpenMock}
              aria-label="Đề mô phỏng"
              className="press grid h-9 w-9 place-items-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
            >
              <ClipboardCheck className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onOpenOutput}
              aria-label="Nói và Viết"
              className="press grid h-9 w-9 place-items-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
            >
              <PenLine className="h-4 w-4" />
            </button>
            <UserMenu compact />
          </div>
        </div>

        {/* Thanh tiến độ (điện thoại + iPad) — desktop lớn hiện trong header */}
        <div className="px-4 pb-3 xl:hidden">
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
        {/* Sidebar cố định (màn hình lớn) — đóng/mở được, trượt mượt về bề rộng 0 */}
        <aside
          className={cn(
            'hidden shrink-0 overflow-hidden bg-white transition-[width] duration-300 ease-smooth lg:block',
            railOpen ? 'border-r border-slate-200 lg:w-80' : 'lg:w-0',
          )}
        >
          {/* Nội dung rộng cố định w-80 để trượt/kẹp thay vì co chữ khi đóng */}
          <div className="thin-scrollbar h-full w-80 overflow-y-auto">
            <Sidebar
              days={days}
              loading={daysLoading}
              error={daysError}
              selectedDay={selectedDay}
              onSelectDay={handleSelect}
              progress={progress}
            />
          </div>
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
