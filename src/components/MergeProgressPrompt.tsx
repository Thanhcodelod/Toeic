import { UploadCloud } from 'lucide-react'
import type { UseProgress } from '../hooks/useProgress'

/**
 * One-time prompt shown after first login when device-local progress (the old
 * anonymous `toeic90:progress`) is detected — offers to merge it into the
 * account. Both actions clear the legacy key, so it appears at most once.
 */
export function MergeProgressPrompt({ progress }: { progress: UseProgress }) {
  if (!progress.legacyMergeAvailable) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 animate-fade-in">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-card-lg">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
          <UploadCloud className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-bold text-slate-900">
          Gộp tiến độ trên thiết bị này?
        </h3>
        <p className="mt-1.5 text-sm text-slate-500">
          Phát hiện tiến độ học đã lưu trên trình duyệt này (chưa gắn với tài
          khoản). Bạn có muốn gộp vào tài khoản để đồng bộ trên mọi thiết bị?
        </p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={progress.dismissLegacyMerge}
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Bỏ qua
          </button>
          <button
            type="button"
            onClick={progress.applyLegacyMerge}
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-card hover:bg-brand-700"
          >
            Gộp vào tài khoản
          </button>
        </div>
      </div>
    </div>
  )
}
