import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  Flame,
  Loader2,
  RefreshCw,
  Target,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { UserMenu } from '../../auth/UserMenu'
import { PART_META } from '../../lib/practiceApi'
import {
  READING_KIND_LABEL,
  SOURCE_LABEL,
  getLearningStats,
  type LearningStats,
} from '../../lib/statsApi'
import { ScoreCalculator } from './ScoreCalculator'
import { StudyPlan } from './StudyPlan'
import { TOTAL_DAYS } from '../../data/constants'

const accColor = (pct: number) =>
  pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-rose-500'
const accText = (pct: number) =>
  pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-600' : 'text-rose-600'

export function StatsPage({ onBack }: { onBack: () => void }) {
  const [stats, setStats] = useState<LearningStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      setStats(await getLearningStats())
      setError(null)
    } catch (e) {
      setError((e as Error)?.message ?? 'Lỗi tải thống kê')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    void load()
  }, [])

  const o = stats?.overall
  const acc = o && o.answered > 0 ? Math.round((100 * o.correct) / o.answered) : 0
  const maxAct = stats ? Math.max(1, ...stats.activity.map((a) => a.count)) : 1

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="z-20 shrink-0 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
          <button
            type="button"
            onClick={onBack}
            className="press inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" /> Lộ trình 90 ngày
          </button>
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-card">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h1 className="text-sm font-bold text-slate-900 sm:text-base">Thống kê học tập</h1>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="press ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Làm mới
          </button>
          <UserMenu />
        </div>
      </header>

      <main className="thin-scrollbar flex-1 overflow-y-auto px-4 py-6">
        {loading && !stats ? (
          <div className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-24 rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <p className="mx-auto max-w-lg rounded-xl border border-rose-200 bg-rose-50 p-4 text-center text-sm text-rose-700">
            {error}
          </p>
        ) : stats && o ? (
          <div className="mx-auto max-w-4xl animate-fade-slide-up space-y-6">
            {/* Tổng quan */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Tile icon={Flame} tone="amber" value={o.streak} label="Ngày liên tiếp" suffix="ngày" />
              <Tile icon={Target} tone="emerald" value={acc} label="Độ chính xác" suffix="%" />
              <Tile icon={BookOpenCheck} tone="violet" value={o.answered} label="Câu đã làm" />
              <Tile icon={CalendarDays} tone="sky" value={o.activeDays} label="Ngày đã học" suffix="ngày" />
            </div>

            {/* Lộ trình cá nhân hoá theo mốc điểm / CEFR */}
            <StudyPlan stats={stats} />

            {/* Độ chính xác theo DẠNG CÂU (Part) */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <h2 className="text-sm font-bold text-slate-900">Độ chính xác theo dạng câu (Part 1–7)</h2>
              {stats.byPart.length === 0 ? (
                <p className="mt-3 text-sm text-slate-400">
                  Chưa có dữ liệu — làm vài bài ở “Ôn Part 1–7” để thấy điểm mạnh/yếu từng dạng.
                </p>
              ) : (
                <div className="mt-4 space-y-2.5">
                  {stats.byPart.map((p) => (
                    <div key={p.part} className="flex items-center gap-3">
                      <span className="w-28 shrink-0 text-xs font-medium text-slate-600">
                        {PART_META[p.part as 1]?.label ?? `Part ${p.part}`}
                      </span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={cn('bar-fill h-full rounded-full', accColor(p.accuracy))}
                          style={{ width: `${p.accuracy}%` }}
                        />
                      </div>
                      <span className={cn('w-14 shrink-0 text-right text-xs font-bold tabular-nums', accText(p.accuracy))}>
                        {p.accuracy}%
                      </span>
                      <span className="w-16 shrink-0 text-right text-[11px] tabular-nums text-slate-400">
                        {p.correct}/{p.answered}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {stats.bySource.filter((s) => s.answered > 0).length > 0 && (
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <p className="mb-2 text-xs font-semibold text-slate-500">Trong lộ trình</p>
                  <div className="space-y-2.5">
                    {stats.bySource
                      .filter((s) => s.answered > 0)
                      .map((s) => (
                        <div key={s.source} className="flex items-center gap-3">
                          <span className="w-28 shrink-0 text-xs font-medium text-slate-600">
                            {SOURCE_LABEL[s.source] ?? s.source}
                          </span>
                          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={cn('bar-fill h-full rounded-full', accColor(s.accuracy))}
                              style={{ width: `${s.accuracy}%` }}
                            />
                          </div>
                          <span className={cn('w-14 shrink-0 text-right text-xs font-bold tabular-nums', accText(s.accuracy))}>
                            {s.accuracy}%
                          </span>
                          <span className="w-16 shrink-0 text-right text-[11px] tabular-nums text-slate-400">
                            {s.correct}/{s.answered}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </section>

            {/* Hoạt động 30 ngày */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <h2 className="text-sm font-bold text-slate-900">Hoạt động 30 ngày gần đây</h2>
              {stats.activity.length === 0 ? (
                <p className="mt-3 text-sm text-slate-400">Chưa có hoạt động nào.</p>
              ) : (
                <div className="mt-4 flex h-28 items-end gap-1">
                  {stats.activity.map((a) => (
                    <div
                      key={a.date}
                      className="group relative flex-1"
                      style={{ height: '100%' }}
                    >
                      <div
                        className="absolute bottom-0 w-full rounded-t bg-gradient-to-t from-emerald-400 to-emerald-500 transition-[height] duration-500"
                        style={{ height: `${Math.max(6, (a.count / maxAct) * 100)}%` }}
                        title={`${a.date}: ${a.count} câu`}
                      />
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-2 text-[11px] text-slate-400">Số câu luyện mỗi ngày (rê chuột để xem chi tiết).</p>
            </section>

            {/* Quy đổi điểm */}
            <ScoreCalculator />

            {/* Tiến độ các mảng */}
            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Prog label="Ngày hoàn thành" value={stats.progress.daysDone} total={TOTAL_DAYS} />
              <Prog label="Từ vựng thuộc" value={stats.progress.vocabMastered} total={stats.progress.vocabStarted || stats.progress.vocabTotal} />
              <Prog label="Bài chép chính tả" value={stats.progress.dictationDone} />
              <Prog label="Reading đã đạt" value={stats.progress.readingMastered} />
            </section>

            {stats.byReadingKind.length > 0 && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                <h2 className="text-sm font-bold text-slate-900">Ôn Reading</h2>
                <div className="mt-3 flex flex-wrap gap-4">
                  {stats.byReadingKind.map((k) => (
                    <div key={k.kind} className="text-sm">
                      <span className="font-semibold text-emerald-600">{k.mastered}</span>
                      <span className="text-slate-400"> đạt / {k.attempted} đã làm · </span>
                      <span className="text-slate-600">{READING_KIND_LABEL[k.kind] ?? k.kind}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : null}
      </main>
    </div>
  )
}

function Tile({
  icon: Icon,
  tone,
  value,
  label,
  suffix,
}: {
  icon: typeof Flame
  tone: 'amber' | 'emerald' | 'violet' | 'sky'
  value: number
  label: string
  suffix?: string
}) {
  const bg = {
    amber: 'from-amber-400 to-amber-600',
    emerald: 'from-emerald-400 to-emerald-600',
    violet: 'from-violet-400 to-violet-600',
    sky: 'from-sky-400 to-sky-600',
  }[tone]
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <span className={cn('grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br text-white', bg)}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900">
        {value}
        {suffix && <span className="ml-0.5 text-sm font-medium text-slate-400">{suffix}</span>}
      </p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}

function Prog({ label, value, total }: { label: string; value: number; total?: number }) {
  const pct = total ? Math.round((100 * value) / Math.max(1, total)) : 0
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-slate-900">
        {value}
        {total != null && <span className="text-sm font-medium text-slate-400">/{total}</span>}
      </p>
      {total != null && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="bar-fill h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  )
}
