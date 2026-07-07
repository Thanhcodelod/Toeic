import { useMemo } from 'react'
import { AlertTriangle, Loader2, RotateCcw } from 'lucide-react'
import { WeekGroup } from './WeekGroup'
import type { DaySummary } from '../../data/types'
import type { UseProgress } from '../../hooks/useProgress'

interface SidebarProps {
  days: DaySummary[]
  loading: boolean
  error: string | null
  selectedDay: number
  onSelectDay: (dayNumber: number) => void
  progress: UseProgress
}

export function Sidebar({
  days,
  loading,
  error,
  selectedDay,
  onSelectDay,
  progress,
}: SidebarProps) {
  const weeks = useMemo(() => {
    const map = new Map<number, DaySummary[]>()
    for (const d of days) {
      const list = map.get(d.week) ?? []
      list.push(d)
      map.set(d.week, list)
    }
    return [...map.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([week, ds]) => ({ week, days: ds }))
  }, [days])

  const handleReset = () => {
    const ok = window.confirm(
      'Bạn có chắc muốn xoá toàn bộ tiến độ đã lưu? Hành động này không thể hoàn tác.',
    )
    if (ok) progress.resetAll()
  }

  return (
    <nav className="flex flex-col pb-6" aria-label="Danh sách 90 ngày học">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Chương trình 13 tuần
        </h2>
        <button
          type="button"
          onClick={handleReset}
          disabled={progress.loading}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
          title="Đặt lại tiến độ"
        >
          <RotateCcw className="h-3 w-3" />
          Đặt lại
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 px-4 py-6 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải danh sách ngày…
        </div>
      )}

      {!loading && error && (
        <div className="mx-3 mt-2 flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-600">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Không tải được danh sách ngày. {error}</span>
        </div>
      )}

      {!loading && !error && (
        <div>
          {weeks.map(({ week, days: weekDays }) => (
            <WeekGroup
              key={week}
              week={week}
              days={weekDays}
              selectedDay={selectedDay}
              onSelectDay={onSelectDay}
              getStatus={progress.getStatus}
            />
          ))}
        </div>
      )}
    </nav>
  )
}
