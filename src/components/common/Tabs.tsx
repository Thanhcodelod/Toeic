import type { ReactNode } from 'react'
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
  return (
    <div
      role="tablist"
      aria-label="Chế độ học"
      className="inline-flex gap-1 rounded-xl bg-slate-100 p-1"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active
        const Icon = tab.icon
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
              isActive
                ? 'bg-white text-brand-700 shadow-card'
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
