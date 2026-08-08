import { cn } from '../../lib/cn'
import { NAV_COLOR, NAV_ITEMS, type AppView } from '../../lib/views'

/**
 * Thanh chuyển nhanh giữa các mục (Lộ trình · Khóa học · Chép chính tả …).
 * Dùng trên đầu mọi trang mục để đi thẳng sang mục khác, không phải quay về lộ trình trước.
 */
export function SectionNav({
  current,
  onNavigate,
}: {
  current: AppView
  onNavigate: (v: AppView) => void
}) {
  return (
    <nav className="thin-scrollbar flex items-center gap-1.5 overflow-x-auto" aria-label="Chuyển mục">
      {NAV_ITEMS.map(({ view, label, icon: Icon, color }) => {
        const active = view === current
        const c = NAV_COLOR[color]
        return (
          <button
            key={view}
            type="button"
            onClick={() => onNavigate(view)}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'press inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-1.5 text-sm font-semibold',
              active ? c.active : c.idle,
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        )
      })}
    </nav>
  )
}
