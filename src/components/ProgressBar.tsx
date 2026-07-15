interface ProgressBarProps {
  /** Completion percentage (0–100). */
  value: number
  doneCount: number
  total: number
  /** Compact variant for tight spaces (hides the numeric label). */
  compact?: boolean
  /** While the server progress is loading (and cache is empty), avoid showing 0%. */
  loading?: boolean
}

export function ProgressBar({
  value,
  doneCount,
  total,
  compact = false,
  loading = false,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value))
  // Only show the loading placeholder when nothing is known yet (cache empty).
  const showLoading = loading && doneCount === 0

  return (
    <div className="w-full">
      {!compact && (
        <div className="mb-1.5 flex items-center justify-between text-xs font-medium">
          <span className="text-slate-500">Tiến độ lộ trình</span>
          <span className="text-brand-700 tabular-nums">
            {showLoading
              ? 'Đang tải…'
              : `Đã hoàn thành ${doneCount}/${total} ngày (${pct}%)`}
          </span>
        </div>
      )}
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuenow={showLoading ? undefined : pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Đã hoàn thành ${doneCount} trên ${total} ngày`}
      >
        {showLoading ? (
          <div className="h-full w-1/3 rounded-full bg-slate-300/80 animate-pulse" />
        ) : (
          <div
            className="bar-fill h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600"
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
    </div>
  )
}
