import { cn } from '../../../lib/cn'
import type { ExamAnswerItem, OptionKey } from '../../../data/types'

const ALL_KEYS: OptionKey[] = ['A', 'B', 'C', 'D']

export const PART_NAMES: Record<number, string> = {
  1: 'Part 1 — Hình ảnh',
  2: 'Part 2 — Hỏi & Đáp',
  3: 'Part 3 — Hội thoại',
  4: 'Part 4 — Bài nói ngắn',
  5: 'Part 5 — Hoàn thành câu',
  6: 'Part 6 — Hoàn thành đoạn văn',
  7: 'Part 7 — Đọc hiểu',
}

interface ExamAnswerGridProps {
  items: ExamAnswerItem[]
  selected: Record<number, OptionKey>
  onSelect: (qNumber: number, key: OptionKey) => void
  disabled?: boolean
}

export function ExamAnswerGrid({
  items,
  selected,
  onSelect,
  disabled = false,
}: ExamAnswerGridProps) {
  // Group by part, preserving order.
  const groups: { part: number; items: ExamAnswerItem[] }[] = []
  for (const it of items) {
    let g = groups[groups.length - 1]
    if (!g || g.part !== it.part) {
      g = { part: it.part, items: [] }
      groups.push(g)
    }
    g.items.push(it)
  }

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g.part}>
          <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-brand-700">
            {PART_NAMES[g.part] ?? `Part ${g.part}`}
          </h4>
          <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
            {g.items.map((it) => {
              const keys = it.numOptions === 3 ? ALL_KEYS.slice(0, 3) : ALL_KEYS
              return (
                <div key={it.qNumber} className="flex items-center gap-1">
                  <span className="w-8 shrink-0 text-right text-xs font-semibold tabular-nums text-slate-500">
                    {it.qNumber}
                  </span>
                  {keys.map((k) => {
                    const isSel = selected[it.qNumber] === k
                    return (
                      <button
                        key={k}
                        type="button"
                        disabled={disabled}
                        onClick={() => onSelect(it.qNumber, k)}
                        aria-label={`Câu ${it.qNumber} chọn ${k}`}
                        aria-pressed={isSel}
                        className={cn(
                          'grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-bold transition-colors',
                          isSel
                            ? 'border-brand-600 bg-brand-600 text-white'
                            : 'border-slate-300 text-slate-500 enabled:hover:border-brand-400 enabled:hover:bg-brand-50',
                          disabled && 'opacity-60',
                        )}
                      >
                        {k}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
