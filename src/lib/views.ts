// Danh mục điều hướng dùng chung cho thanh chuyển mục (SectionNav) trên mọi trang.
import {
  BarChart3,
  BookMarked,
  BookOpenCheck,
  ClipboardCheck,
  Compass,
  GraduationCap,
  Headphones,
  ListChecks,
  PenLine,
  type LucideIcon,
} from 'lucide-react'

export type AppView =
  | 'course'
  | 'vocab'
  | 'dictation'
  | 'reading'
  | 'parts'
  | 'stats'
  | 'mock'
  | 'output'
  | 'khoahoc'

export type NavColor = 'slate' | 'teal' | 'sky' | 'violet' | 'indigo' | 'emerald' | 'rose' | 'amber'

export interface NavItem {
  view: AppView
  label: string
  icon: LucideIcon
  color: NavColor
}

export const NAV_ITEMS: NavItem[] = [
  { view: 'course', label: 'Lộ trình', icon: GraduationCap, color: 'slate' },
  { view: 'khoahoc', label: 'Khóa học', icon: Compass, color: 'teal' },
  { view: 'dictation', label: 'Chép chính tả', icon: Headphones, color: 'sky' },
  { view: 'vocab', label: 'Ôn từ vựng', icon: BookMarked, color: 'violet' },
  { view: 'reading', label: 'Ôn Reading', icon: BookOpenCheck, color: 'sky' },
  { view: 'parts', label: 'Ôn Part 1–7', icon: ListChecks, color: 'indigo' },
  { view: 'stats', label: 'Thống kê', icon: BarChart3, color: 'emerald' },
  { view: 'mock', label: 'Đề mô phỏng', icon: ClipboardCheck, color: 'rose' },
  { view: 'output', label: 'Nói & Viết', icon: PenLine, color: 'amber' },
]

// Class Tailwind viết nguyên chuỗi để trình quét sinh đúng.
export const NAV_COLOR: Record<NavColor, { active: string; idle: string }> = {
  slate: { active: 'bg-slate-800 text-white border-transparent', idle: 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100' },
  teal: { active: 'bg-teal-600 text-white border-transparent', idle: 'border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100' },
  sky: { active: 'bg-sky-600 text-white border-transparent', idle: 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100' },
  violet: { active: 'bg-violet-600 text-white border-transparent', idle: 'border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100' },
  indigo: { active: 'bg-indigo-600 text-white border-transparent', idle: 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100' },
  emerald: { active: 'bg-emerald-600 text-white border-transparent', idle: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
  rose: { active: 'bg-rose-600 text-white border-transparent', idle: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100' },
  amber: { active: 'bg-amber-500 text-white border-transparent', idle: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100' },
}
