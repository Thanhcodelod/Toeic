import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'

export interface TabDef {
  id: string
  label: string
  icon?: LucideIcon
  badge?: ReactNode
}

interface TabsProps {
  tabs: TabDef[]
  active: string
  onChange: (id: string) => void
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  const listRef = useRef<HTMLDivElement>(null)
  // The pill lives behind the buttons and simply TRANSLATES to the active tab —
  // no layout thrash, just transform + width (both handled by .tab-underline).
  const [pill, setPill] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  })

  useLayoutEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-tab-id="${active}"]`,
    )
    if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth })
  }, [active, tabs])

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label="Chế độ học"
      className="relative inline-flex gap-1 rounded-xl bg-slate-100 p-1"
    >
      {/* Sliding pill (decorative — the real focus styling lives on the button) */}
      <span
        aria-hidden="true"
        className="tab-underline pointer-events-none absolute inset-y-1 left-0 rounded-lg bg-white shadow-card"
        style={{
          width: pill.width,
          transform: `translate3d(${pill.left}px, 0, 0)`,
          opacity: pill.width ? 1 : 0,
        }}
      />
      {tabs.map((tab) => {
        const isActive = tab.id === active
        const Icon = tab.icon
        return (
          <button
            key={tab.id}
            data-tab-id={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'press relative z-10 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium',
              isActive
                ? 'text-brand-700'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {tab.label}
            {tab.badge}
          </button>
        )
      })}
    </div>
  )
}
