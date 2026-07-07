import { BookOpen, ClipboardList, Layers, type LucideIcon } from 'lucide-react'
import type { ContentType } from '../data/types'

interface ContentMeta {
  label: string
  icon: LucideIcon
  /** Icon chip background + text. */
  iconWrap: string
  /** Small pill (background + text). */
  pill: string
  /** Solid accent text colour. */
  accent: string
}

export const CONTENT_META: Record<ContentType, ContentMeta> = {
  grammar: {
    label: 'Ngữ pháp',
    icon: BookOpen,
    iconWrap: 'bg-brand-100 text-brand-700',
    pill: 'bg-brand-50 text-brand-700 ring-1 ring-brand-100',
    accent: 'text-brand-700',
  },
  vocabulary: {
    label: 'Từ vựng',
    icon: Layers,
    iconWrap: 'bg-violet-100 text-violet-700',
    pill: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100',
    accent: 'text-violet-700',
  },
  practice: {
    label: 'Luyện đề',
    icon: ClipboardList,
    iconWrap: 'bg-rose-100 text-rose-700',
    pill: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100',
    accent: 'text-rose-700',
  },
}
