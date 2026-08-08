import { useEffect, useMemo, useState } from 'react'
import { CalendarClock, Check, Flag, Loader2, Pencil, TrendingUp } from 'lucide-react'
import { cn } from '../../lib/cn'
import { PART_META } from '../../lib/practiceApi'
import { cefrBand, estimateScore } from '../../lib/toeicScore'
import { getTarget, setTarget, type TargetInfo } from '../../lib/targetApi'
import type { LearningStats } from '../../lib/statsApi'

const TARGETS = [450, 550, 650, 750, 850, 950]
const LC_PARTS = [1, 2, 3, 4]
const RC_PARTS = [5, 6, 7]

// Gợi ý luyện tập cho từng Part (bám các mục sẵn có trong app).
const PART_TIP: Record<number, string> = {
  1: 'Luyện tả tranh ở “Ôn Part 1–7”, nghe kỹ giới từ chỉ vị trí.',
  2: 'Nghe hỏi–đáp ở “Ôn Part 1–7”, chú ý câu trả lời gián tiếp.',
  3: 'Nghe hội thoại ở “Ôn Part 1–7”, bật transcript đồng bộ để soi từ.',
  4: 'Nghe bài nói ngắn ở “Ôn Part 1–7”, tóm ý chính trước khi chọn.',
  5: 'Luyện ngữ pháp trong lộ trình + “Ôn Reading” (biến đổi từ loại).',
  6: 'Làm đoạn điền từ ở “Ôn Part 1–7” (Part 6) và bài Ngữ pháp.',
  7: 'Đọc đoạn dài ở “Ôn Part 1–7” (Part 7), bôi vàng + ghi chú ý chính.',
}

function sectionAccuracy(byPart: LearningStats['byPart'], parts: number[], fallback: number): number {
  const rows = byPart.filter((p) => parts.includes(p.part) && p.answered > 0)
  const answered = rows.reduce((s, p) => s + p.answered, 0)
  if (answered === 0) return fallback
  const correct = rows.reduce((s, p) => s + p.correct, 0)
  return Math.round((100 * correct) / answered)
}

export function StudyPlan({ stats }: { stats: LearningStats }) {
  const [target, setT] = useState<TargetInfo | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [pickScore, setPickScore] = useState(650)
  const [pickDate, setPickDate] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getTarget()
      .then((t) => {
        setT(t)
        if (t) {
          setPickScore(t.targetScore)
          setPickDate(t.targetDate ?? '')
        } else {
          setEditing(true) // chưa đặt mục tiêu -> mở form
        }
      })
      .catch(() => setEditing(true))
      .finally(() => setLoaded(true))
  }, [])

  const hasData = stats.overall.answered > 0
  const overallAcc = hasData ? Math.round((100 * stats.overall.correct) / stats.overall.answered) : 0

  const current = useMemo(() => {
    if (!hasData) return null
    const lcAcc = sectionAccuracy(stats.byPart, LC_PARTS, overallAcc)
    const rcAcc = sectionAccuracy(stats.byPart, RC_PARTS, overallAcc)
    return estimateScore(lcAcc, rcAcc) // accuracy% ~ số câu đúng /100
  }, [stats.byPart, hasData, overallAcc])

  const weakest = useMemo(
    () =>
      stats.byPart
        .filter((p) => p.answered >= 3)
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 3),
    [stats.byPart],
  )

  const daysLeft = useMemo(() => {
    if (!target?.targetDate) return null
    const end = new Date(target.targetDate + 'T00:00:00')
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return Math.round((end.getTime() - now.getTime()) / 86_400_000)
  }, [target?.targetDate])

  const save = async () => {
    setBusy(true)
    try {
      const t = await setTarget(pickScore, pickDate || null)
      setT(t)
      setEditing(false)
    } catch {
      /* bỏ qua */
    } finally {
      setBusy(false)
    }
  }

  if (!loaded)
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <div className="flex items-center gap-2 text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải lộ trình…</div>
      </section>
    )

  const targetScore = target?.targetScore ?? pickScore
  const [targetCefr] = cefrBand(targetScore)
  const gap = current ? targetScore - current.total : null

  return (
    <section className="overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-card">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
          <Flag className="h-4 w-4" />
        </span>
        <h2 className="text-sm font-bold text-slate-900">Lộ trình cá nhân hoá</h2>
        {target && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="press ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-100"
          >
            <Pencil className="h-3.5 w-3.5" /> Đổi mục tiêu
          </button>
        )}
      </div>

      {/* Đặt / đổi mục tiêu */}
      {editing ? (
        <div className="mt-4 rounded-xl border border-indigo-100 bg-white p-4">
          <p className="text-xs font-semibold text-slate-500">Mốc điểm mục tiêu (TOEIC L&amp;R)</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {TARGETS.map((s) => {
              const [c] = cefrBand(s)
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPickScore(s)}
                  className={cn(
                    'press rounded-lg border px-3 py-1.5 text-sm font-bold tabular-nums transition',
                    pickScore === s ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300',
                  )}
                >
                  {s}
                  <span className={cn('ml-1 text-[10px] font-medium', pickScore === s ? 'text-indigo-100' : 'text-slate-400')}>{c}</span>
                </button>
              )
            })}
          </div>
          <label className="mt-3 block text-xs font-semibold text-slate-500">Ngày dự thi (không bắt buộc)</label>
          <input
            type="date"
            value={pickDate}
            onChange={(e) => setPickDate(e.target.value)}
            className="mt-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
          />
          <div className="mt-3 flex justify-end gap-2">
            {target && (
              <button type="button" onClick={() => setEditing(false)} className="press rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100">
                Huỷ
              </button>
            )}
            <button type="button" onClick={() => void save()} disabled={busy} className="press inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Lưu mục tiêu
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Hiện trạng vs mục tiêu */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white p-3 text-center shadow-sm">
              <p className="text-[11px] font-semibold uppercase text-slate-400">Ước lượng hiện tại</p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums text-slate-900">{current ? current.total : '—'}</p>
              {current && <p className="text-[11px] font-medium text-slate-500">{current.cefr}</p>}
            </div>
            <div className="grid place-items-center">
              <TrendingUp className={cn('h-6 w-6', gap != null && gap <= 0 ? 'text-emerald-500' : 'text-indigo-400')} />
              {gap != null && (
                <p className={cn('mt-1 text-xs font-bold tabular-nums', gap <= 0 ? 'text-emerald-600' : 'text-indigo-600')}>
                  {gap <= 0 ? 'Đã đạt!' : `còn ${gap}`}
                </p>
              )}
            </div>
            <div className="rounded-xl bg-indigo-600 p-3 text-center text-white shadow-sm">
              <p className="text-[11px] font-semibold uppercase text-indigo-200">Mục tiêu</p>
              <p className="mt-0.5 text-2xl font-bold tabular-nums">{targetScore}</p>
              <p className="text-[11px] font-medium text-indigo-100">{targetCefr}</p>
            </div>
          </div>

          {daysLeft != null && (
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500">
              <CalendarClock className="h-3.5 w-3.5" />
              {daysLeft > 0 ? `Còn ${daysLeft} ngày đến ngày dự thi` : daysLeft === 0 ? 'Hôm nay là ngày dự thi — chúc may mắn!' : 'Ngày dự thi đã qua — cập nhật mốc mới nhé'}
            </p>
          )}

          {!hasData ? (
            <p className="mt-4 rounded-xl bg-amber-50 p-3 text-center text-sm text-amber-700">
              Chưa đủ dữ liệu để định vị trình độ. Hãy làm <b>Đề mô phỏng → Kiểm tra đầu vào</b> hoặc vài bài “Ôn Part 1–7” để nhận lộ trình.
            </p>
          ) : (
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Ưu tiên cải thiện</p>
              {weakest.length === 0 ? (
                <p className="mt-1 text-sm text-slate-400">Làm thêm bài để xác định Part yếu.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {weakest.map((p) => (
                    <li key={p.part} className="flex items-start gap-2.5 rounded-xl bg-white p-3 shadow-sm">
                      <span className="mt-0.5 grid h-6 shrink-0 place-items-center rounded-md bg-rose-100 px-2 text-xs font-bold text-rose-600 tabular-nums">
                        {p.accuracy}%
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{PART_META[p.part as 1]?.label ?? `Part ${p.part}`}</p>
                        <p className="text-xs text-slate-500">{PART_TIP[p.part] ?? 'Luyện thêm dạng câu này.'}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 rounded-xl bg-indigo-50/70 p-3 text-xs text-indigo-800">
                <b>Mỗi ngày:</b> 1 bài Part yếu nhất · 10–15 từ vựng · 1 bài chép chính tả.
                {gap != null && gap > 150 && ' Mục tiêu còn xa — bám sát lộ trình 90 ngày, đừng bỏ ngày nào.'}
                {gap != null && gap > 0 && gap <= 150 && ' Bạn đang gần mục tiêu — dồn sức vào các Part yếu ở trên.'}
                {gap != null && gap <= 0 && ' Bạn đã đạt mục tiêu — thử nâng mốc cao hơn để tiếp tục tiến bộ!'}
              </p>
            </div>
          )}
        </>
      )}
    </section>
  )
}
