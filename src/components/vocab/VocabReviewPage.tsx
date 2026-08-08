import { useCallback, useEffect, useState } from 'react'
import {
  ArrowLeft,
  BookMarked,
  GraduationCap,
  Library,
  Loader2,
  Puzzle,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { getNewVocab, getReviewVocab, getVocabStats } from '../../lib/api'
import { UserMenu } from '../../auth/UserMenu'
import { VocabQuiz } from '../workspace/vocabulary/VocabQuiz'
import { VocabLearnSession } from '../workspace/vocabulary/VocabLearnSession'
import { SavedWordsPanel } from './SavedWordsPanel'
import { VocabReference } from './VocabReference'
import { MatchingGame } from './MatchingGame'
import type { VocabCard, VocabStats } from '../../data/types'

type BatchKind = 'new' | 'review' | 'match'

interface VocabReviewPageProps {
  onBack: () => void
}

export function VocabReviewPage({ onBack }: VocabReviewPageProps) {
  const [stats, setStats] = useState<VocabStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [batch, setBatch] = useState<VocabCard[] | null>(null)
  const [batchKind, setBatchKind] = useState<BatchKind>('new')
  const [fetching, setFetching] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [count, setCount] = useState(15)
  const [tool, setTool] = useState<'reference' | null>(null)

  const refreshStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      setStats(await getVocabStats())
      setError(null)
    } catch (e) {
      setError((e as Error)?.message ?? 'Lỗi tải thống kê')
    } finally {
      setStatsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshStats()
  }, [refreshStats])

  const startBatch = async (kind: BatchKind) => {
    setFetching(true)
    setNotice(null)
    try {
      let cards =
        kind === 'new' ? await getNewVocab(count)
        : kind === 'match' ? await getReviewVocab(30)
        : await getReviewVocab(count)
      if (kind === 'match' && cards.length < 2) cards = await getNewVocab(30)
      if (cards.length === 0) {
        setNotice(
          kind === 'new'
            ? 'Bạn đã học qua tất cả các từ trong kho! Hãy chuyển sang “Ôn từ chưa thuộc”.'
            : 'Chưa có từ nào tới hạn ôn. Hãy “Học từ mới”, hoặc quay lại sau khi tới lịch ôn.',
        )
        return
      }
      setBatchKind(kind)
      setBatch(cards)
    } catch (e) {
      setNotice((e as Error)?.message ?? 'Lỗi tải từ vựng')
    } finally {
      setFetching(false)
    }
  }

  const exitBatch = () => {
    setBatch(null)
    void refreshStats()
  }

  const pct = stats && stats.total > 0
    ? Math.round((stats.mastered / stats.total) * 100)
    : 0

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Top bar */}
      <header className="z-20 shrink-0 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Lộ trình 90 ngày
          </button>
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-card">
              <BookMarked className="h-5 w-5" />
            </div>
            <h1 className="text-sm font-bold text-slate-900 sm:text-base">
              Ôn tập từ vựng
            </h1>
          </div>
          <div className="ml-auto">
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="thin-scrollbar flex-1 overflow-y-auto px-4 py-6">
        {tool === 'reference' ? (
          <VocabReference onBack={() => setTool(null)} />
        ) : batch && batchKind === 'match' ? (
          <MatchingGame cards={batch} onExit={exitBatch} />
        ) : batch && batchKind === 'new' ? (
          // Học từ mới = đúng bài học xen kẽ như trong lộ trình 90 ngày:
          // gặp 2 từ → kiểm tra ngay 2 từ đó → qua đủ 6 dạng mới thôi.
          <VocabLearnSession
            cards={batch}
            onExit={() => {
              void refreshStats()
              exitBatch()
            }}
          />
        ) : batch ? (
          // Ôn tập ngắt quãng: đúng thì LÊN cấp, sai thì tụt cấp.
          <VocabQuiz
            cards={batch}
            mode="review"
            autoStart
            fixedCount={batch.length}
            onFinish={() => void refreshStats()}
            onExit={exitBatch}
          />
        ) : (
          <div className="mx-auto max-w-2xl space-y-5">
            {/* Stats */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">
                  Tiến trình từ vựng
                </h2>
                <button
                  type="button"
                  onClick={() => void refreshStats()}
                  className="press inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Làm mới
                </button>
              </div>

              {statsLoading && !stats ? (
                <div aria-hidden className="mt-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="skeleton h-[68px]" />
                    <div className="skeleton h-[68px]" />
                    <div className="skeleton h-[68px]" />
                    <div className="skeleton h-[68px]" />
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="skeleton h-3 w-28" />
                    <div className="skeleton h-2.5 w-full rounded-full" />
                  </div>
                </div>
              ) : error ? (
                <p className="mt-3 text-sm text-rose-600">{error}</p>
              ) : stats ? (
                <>
                  <div className="stagger mt-4 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-2xl font-bold text-slate-900">
                        {stats.total}
                      </p>
                      <p className="text-xs text-slate-500">Tổng từ</p>
                    </div>
                    <div className="rounded-xl bg-amber-50 p-3">
                      <p className="text-2xl font-bold text-amber-600">
                        {stats.learning}
                      </p>
                      <p className="text-xs text-slate-500">Đang học dở</p>
                    </div>
                    <div className="rounded-xl bg-violet-50 p-3">
                      <p className="text-2xl font-bold text-violet-700">
                        {stats.started}
                      </p>
                      <p className="text-xs text-slate-500">Đã qua 6 dạng</p>
                    </div>
                    <div className="rounded-xl bg-emerald-50 p-3">
                      <p className="text-2xl font-bold text-emerald-600">
                        {stats.mastered}
                      </p>
                      <p className="text-xs text-slate-500">Thông thạo</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs text-slate-500">
                      <span>Đã thành thạo</span>
                      <span className="font-semibold text-emerald-600">{pct}%</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="bar-fill h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Count */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-sm text-slate-600">Số từ mỗi lượt:</span>
              {[10, 15, 20].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCount(n)}
                  className={
                    'press rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ' +
                    (count === n
                      ? 'border-violet-400 bg-violet-50 text-violet-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50')
                  }
                >
                  {n}
                </button>
              ))}
              <span className="text-xs text-slate-400">
                (khuyến nghị ≤ 20 từ/lượt)
              </span>
            </div>

            {notice && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-700">
                {notice}
              </p>
            )}

            {/* Two modes */}
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={fetching}
                onClick={() => startBatch('new')}
                className="group lift press flex flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-card hover:border-violet-300 disabled:opacity-60"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-100 text-violet-700">
                  <GraduationCap className="h-6 w-6" />
                </span>
                <span className="text-base font-bold text-slate-900">
                  Học từ mới
                </span>
                <span className="text-sm text-slate-500">
                  Gặp 2 từ → kiểm tra ngay 2 từ đó. Qua đủ 6 dạng mới thôi.
                </span>
              </button>

              <button
                type="button"
                disabled={fetching}
                onClick={() => startBatch('review')}
                className="group lift press flex flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-card hover:border-violet-300 disabled:opacity-60"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Sparkles className="h-6 w-6" />
                </span>
                <span className="text-base font-bold text-slate-900">
                  Ôn từ đến hạn
                  {stats && stats.due > 0 && (
                    <span className="ml-1.5 inline-block animate-pop rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                      {stats.due}
                    </span>
                  )}
                </span>
                <span className="text-sm text-slate-500">
                  Từ đã học, tới lịch ôn (2 giờ → 2 → 3 → 5 → 8 ngày). Đúng thì lên
                  cấp.
                </span>
              </button>

              <button
                type="button"
                disabled={fetching}
                onClick={() => startBatch('match')}
                className="group lift press flex flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-card hover:border-violet-300 disabled:opacity-60"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-100 text-amber-700">
                  <Puzzle className="h-6 w-6" />
                </span>
                <span className="text-base font-bold text-slate-900">Trò chơi tìm cặp</span>
                <span className="text-sm text-slate-500">Nối từ ↔ nghĩa cho nhanh — ôn lại vui hơn.</span>
              </button>

              <button
                type="button"
                onClick={() => setTool('reference')}
                className="group lift press flex flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-card hover:border-violet-300"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-sky-100 text-sky-700">
                  <Library className="h-6 w-6" />
                </span>
                <span className="text-base font-bold text-slate-900">Tra cứu kho từ</span>
                <span className="text-sm text-slate-500">Duyệt/tìm 837 từ trọng tâm — nghe, lưu, đánh dấu đã thuộc.</span>
              </button>
            </div>

            {fetching && (
              <p className="flex items-center justify-center gap-2 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Đang tải từ vựng…
              </p>
            )}

            {/* Sổ tay từ lưu khi nghe */}
            <div className="border-t border-slate-200 pt-5">
              <SavedWordsPanel />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
