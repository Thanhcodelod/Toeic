import { useEffect } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { DayWorkspace } from './workspace/DayWorkspace'
import { useDayDetail } from '../hooks/useDayDetail'
import { dayHasContent } from '../data/types'
import type { UseProgress } from '../hooks/useProgress'

interface DayViewProps {
  dayNumber: number
  progress: UseProgress
  onSelectDay: (dayNumber: number) => void
}

export function DayView({ dayNumber, progress, onSelectDay }: DayViewProps) {
  const { day, loading, error } = useDayDetail(dayNumber)
  const { markInProgress, loading: progressLoading } = progress

  // Opening a day that has content marks it "Đang học" — but wait for the
  // initial progress fetch so we don't race/clobber a day already done.
  useEffect(() => {
    if (progressLoading) return
    if (day && dayHasContent(day)) markInProgress(day.day)
  }, [day, markInProgress, progressLoading])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center py-24 text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Đang tải nội dung Ngày {dayNumber}…
      </div>
    )
  }

  if (error || !day) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-100 text-rose-500">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-slate-800">
          Không tải được dữ liệu
        </h3>
        <p className="mt-1.5 text-sm text-slate-500">
          {error ?? 'Không tìm thấy nội dung cho ngày này.'}
        </p>
        <p className="mt-3 text-xs text-slate-400">
          Kiểm tra kết nối Supabase (biến môi trường VITE_SUPABASE_URL /
          VITE_SUPABASE_ANON_KEY) rồi thử lại.
        </p>
      </div>
    )
  }

  return (
    <DayWorkspace day={day} progress={progress} onSelectDay={onSelectDay} />
  )
}
