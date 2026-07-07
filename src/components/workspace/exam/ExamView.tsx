import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Clock,
  Headphones,
  ListChecks,
  Minimize2,
  PlayCircle,
  Send,
} from 'lucide-react'
import { cn } from '../../../lib/cn'
import { useCountdown } from '../../../hooks/useCountdown'
import { useLocalStorage } from '../../../hooks/useLocalStorage'
import { AudioPlayer } from '../practice/AudioPlayer'
import { CountdownTimer } from '../practice/CountdownTimer'
import { ExamAnswerGrid } from './ExamAnswerGrid'
import { ExamPdf } from './ExamPdf'
import { ExamResult } from './ExamResult'
import type { ExamContent, OptionKey } from '../../../data/types'
import type { UseProgress } from '../../../hooks/useProgress'

type SectionKey = 'listening' | 'reading'

interface Section {
  key: SectionKey
  label: string
  from: number
  to: number
  pdfUrl?: string
  audioUrl?: string
  hasAudio: boolean
}

interface ExamViewProps {
  dayNumber: number
  title: string
  content: ExamContent
  progress: UseProgress
}

export function ExamView({ dayNumber, content, progress }: ExamViewProps) {
  const sections: Section[] = useMemo(() => {
    const listening: Section = {
      key: 'listening',
      label: 'Listening (Part 1–4)',
      from: 1,
      to: 100,
      pdfUrl: content.listeningPdfUrl,
      audioUrl: content.audioUrl,
      hasAudio: true,
    }
    const reading: Section = {
      key: 'reading',
      label: 'Reading (Part 5–7)',
      from: 101,
      to: 200,
      pdfUrl: content.readingPdfUrl,
      hasAudio: false,
    }
    if (content.mode === 'listening') return [listening]
    if (content.mode === 'reading') return [reading]
    return [listening, reading]
  }, [content])

  const totalMinutes =
    content.mode === 'full'
      ? content.listeningMinutes + content.readingMinutes
      : content.mode === 'listening'
        ? content.listeningMinutes
        : content.readingMinutes

  const [phase, setPhase] = useState<'intro' | 'doing' | 'submitted'>('intro')
  const [activeKey, setActiveKey] = useState<SectionKey>(sections[0].key)
  const [answers, setAnswers] = useLocalStorage<Record<number, OptionKey>>(
    `toeic90:exam:${dayNumber}:answers`,
    {},
  )

  // --- Fullscreen wiring -----------------------------------------------------
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  // True once the test has been ended on purpose (submit / stop). Reset when a
  // new attempt starts. Guards the fullscreenchange handler from treating an
  // intentional exit as "user bailed → cancel". Because it's only ever set
  // while leaving the 'doing' phase and cleared in startExam, it can't wrongly
  // suppress a later genuine Esc-exit.
  const endingRef = useRef(false)

  const active = sections.find((s) => s.key === activeKey) ?? sections[0]
  const activeItems = content.answers.filter(
    (it) => it.qNumber >= active.from && it.qNumber <= active.to,
  )
  const doneItems = content.answers.filter((it) =>
    content.mode === 'listening'
      ? it.qNumber <= 100
      : content.mode === 'reading'
        ? it.qNumber > 100
        : true,
  )
  const answeredCount = doneItems.filter((it) => answers[it.qNumber]).length

  const submitRef = useRef<() => void>(() => {})
  const { secondsLeft, running, formatted, start, pause, reset } = useCountdown({
    durationSeconds: totalMinutes * 60,
    storageKey: `toeic90:exam:${dayNumber}:timer`,
    onExpire: () => submitRef.current(),
  })

  const correctCount = doneItems.filter(
    (it) => answers[it.qNumber] === it.correct,
  ).length
  const scorePct =
    doneItems.length > 0
      ? Math.round((correctCount / doneItems.length) * 100)
      : 0

  const leaveFullscreen = () => {
    if (typeof document !== 'undefined' && document.fullscreenElement)
      document.exitFullscreen().catch(() => {})
  }

  const handleSubmit = useCallback(() => {
    setPhase((p) => {
      if (p === 'submitted') return p
      endingRef.current = true
      pause()
      progress.recordPractice(dayNumber, scorePct, {})
      return 'submitted'
    })
    leaveFullscreen()
  }, [pause, progress, dayNumber, scorePct])

  useEffect(() => {
    submitRef.current = handleSubmit
  }, [handleSubmit])

  // "Thoát" button / any deliberate stop → cancel the attempt (answers kept).
  const stopExam = useCallback(() => {
    endingRef.current = true
    pause()
    setPhase('intro')
    leaveFullscreen()
  }, [pause])

  useEffect(() => {
    if (phase === 'submitted') window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [phase])

  // Track fullscreen; if the user leaves it MID-TEST (e.g. Esc), cancel the exam.
  useEffect(() => {
    const onChange = () => {
      const fs = Boolean(document.fullscreenElement)
      setIsFullscreen(fs)
      if (!fs && phaseRef.current === 'doing' && !endingRef.current) {
        pause()
        setPhase('intro') // exiting fullscreen cancels the attempt
      }
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [pause])

  // Warn before leaving the tab while a timed test is in progress.
  useEffect(() => {
    if (phase !== 'doing') return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [phase])

  const startExam = async () => {
    endingRef.current = false
    setPhase('doing')
    start()
    const el = containerRef.current
    if (el && el.requestFullscreen && !document.fullscreenElement) {
      try {
        await el.requestFullscreen()
      } catch {
        /* fullscreen denied — continue windowed */
      }
    }
  }

  const handleSubmitClick = () => {
    const remaining = doneItems.length - answeredCount
    if (remaining > 0) {
      const ok = window.confirm(
        `Bạn còn ${remaining} câu chưa trả lời. Vẫn nộp bài?`,
      )
      if (!ok) return
    }
    handleSubmit()
  }

  const handleRetry = () => {
    setAnswers({})
    reset()
    setActiveKey(sections[0].key)
    setPhase('intro')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSelect = (qNumber: number, key: OptionKey) => {
    setAnswers((prev) => ({ ...prev, [qNumber]: key }))
  }

  // ---- Views ----------------------------------------------------------------
  const intro = (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
        <h2 className="text-xl font-bold text-slate-900">{content.title}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {content.mode === 'full'
            ? 'Bài thi đầy đủ: Listening + Reading (200 câu)'
            : content.mode === 'listening'
              ? 'Phần Listening (Part 1–4, 100 câu)'
              : 'Phần Reading (Part 5–7, 100 câu)'}
        </p>

        <div className="mt-5 space-y-2">
          {sections.map((s) => (
            <div
              key={s.key}
              className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm"
            >
              {s.hasAudio ? (
                <Headphones className="h-5 w-5 text-brand-600" />
              ) : (
                <ListChecks className="h-5 w-5 text-brand-600" />
              )}
              <span className="font-medium text-slate-800">{s.label}</span>
              <span className="ml-auto text-slate-500">
                câu {s.from}–{s.to}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-2 px-1 pt-1 text-sm text-slate-500">
            <Clock className="h-4 w-4" />
            Thời gian: <strong>{totalMinutes} phút</strong> · hết giờ tự động nộp
            bài
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-700">
          Bài thi mở ở chế độ <strong>toàn màn hình</strong> để tập trung. Đề
          hiển thị dạng ảnh (bản scan ETS) — bạn xem đề + nghe audio và chọn đáp
          án ở phiếu trả lời; máy tự chấm khi nộp.{' '}
          <strong>Thoát toàn màn hình sẽ dừng bài thi</strong> (đáp án đã chọn
          vẫn được giữ).
        </div>

        {progress.getBestScore(dayNumber) != null && (
          <p className="mt-3 text-sm text-slate-500">
            Lần làm tốt nhất: <strong>{progress.getBestScore(dayNumber)}%</strong>
          </p>
        )}

        <button
          type="button"
          onClick={startExam}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white shadow-card hover:bg-brand-700"
        >
          <PlayCircle className="h-5 w-5" />
          Bắt đầu làm bài
        </button>
      </div>
    </div>
  )

  const pdfHeight = isFullscreen
    ? 'h-[calc(100vh-9rem)] min-h-[420px]'
    : 'h-[76vh] min-h-[540px]'

  const doing = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {sections.length > 1 && (
          <div className="inline-flex gap-1 rounded-xl bg-slate-100 p-1">
            {sections.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setActiveKey(s.key)}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  s.key === activeKey
                    ? 'bg-white text-brand-700 shadow-card'
                    : 'text-slate-500 hover:text-slate-700',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
        {isFullscreen && (
          <button
            type="button"
            onClick={stopExam}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            title="Thoát toàn màn hình (dừng bài thi)"
          >
            <Minimize2 className="h-4 w-4" />
            Thoát
          </button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Left: audio + đề */}
        <div className="space-y-4">
          {active.hasAudio && active.audioUrl && (
            <AudioPlayer src={active.audioUrl} title="Audio phần nghe" />
          )}
          {active.pdfUrl ? (
            <div className={pdfHeight}>
              <ExamPdf url={active.pdfUrl} label={`Đề — ${active.label}`} />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center text-sm text-slate-500">
              Chưa có file đề cho phần này trên Storage.
            </div>
          )}
        </div>

        {/* Right: timer + submit + answer sheet */}
        <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <CountdownTimer
            formatted={formatted}
            secondsLeft={secondsLeft}
            totalSeconds={totalMinutes * 60}
            running={running}
            onStart={start}
            onPause={pause}
          />

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
            <p className="mb-2 text-center text-sm text-slate-500">
              Đã trả lời{' '}
              <span className="font-semibold text-slate-800">
                {answeredCount}/{doneItems.length}
              </span>{' '}
              câu
            </p>
            <button
              type="button"
              onClick={handleSubmitClick}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white shadow-card hover:bg-brand-700"
            >
              <Send className="h-4 w-4" />
              Nộp bài
            </button>
          </div>

          <div className="thin-scrollbar max-h-[calc(100vh-360px)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">
              Phiếu trả lời — {active.label}
            </h3>
            <ExamAnswerGrid
              items={activeItems}
              selected={answers}
              onSelect={handleSelect}
            />
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div
      ref={containerRef}
      className={cn(
        isFullscreen && 'h-screen w-screen overflow-auto bg-slate-50 p-4 sm:p-6',
      )}
    >
      {phase === 'intro' && intro}
      {phase === 'doing' && doing}
      {phase === 'submitted' && (
        <ExamResult content={content} answers={answers} onRetry={handleRetry} />
      )}
    </div>
  )
}
