import { useCallback, useEffect, useRef, useState } from 'react'
import { ListChecks, Send } from 'lucide-react'
import { useCountdown } from '../../../hooks/useCountdown'
import { useLocalStorage } from '../../../hooks/useLocalStorage'
import { cn } from '../../../lib/cn'
import { AudioPlayer } from './AudioPlayer'
import { CountdownTimer } from './CountdownTimer'
import { ListeningPlayer } from './ListeningPlayer'
import { PdfViewer } from './PdfViewer'
import { ResultPanel } from './ResultPanel'
import { TestQuestion } from './TestQuestion'
import { isAudioOnlyListening } from '../../../data/types'
import type { OptionKey, PracticeContent } from '../../../data/types'
import type { UseProgress } from '../../../hooks/useProgress'

interface PracticeViewProps {
  dayNumber: number
  title: string
  content: PracticeContent
  progress: UseProgress
}

export function PracticeView({
  dayNumber,
  title,
  content,
  progress,
}: PracticeViewProps) {
  const questions = content.questions
  const total = questions.length
  const totalSeconds = content.durationMinutes * 60

  // Group consecutive questions that share the same reading passage (Part 6/7).
  const passageGroups: {
    passage?: string
    items: { q: (typeof questions)[number]; index: number }[]
  }[] = []
  questions.forEach((q, index) => {
    const last = passageGroups[passageGroups.length - 1]
    if (last && (last.passage ?? '') === (q.passage ?? '')) {
      last.items.push({ q, index })
    } else {
      passageGroups.push({ passage: q.passage, items: [{ q, index }] })
    }
  })

  const [answers, setAnswers] = useLocalStorage<Record<string, OptionKey>>(
    `toeic90:practice:${dayNumber}:answers`,
    {},
  )
  const [submitted, setSubmitted] = useState(false)

  const correctCount = questions.reduce(
    (sum, q) => (answers[q.id] === q.correct ? sum + 1 : sum),
    0,
  )
  const scorePct = total > 0 ? Math.round((correctCount / total) * 100) : 0
  const answeredCount = Object.keys(answers).length

  const submitRef = useRef<() => void>(() => {})
  const { secondsLeft, running, formatted, start, pause, reset } = useCountdown({
    durationSeconds: totalSeconds,
    storageKey: `toeic90:practice:${dayNumber}:timer`,
    onExpire: () => submitRef.current(),
  })

  const handleSubmit = useCallback(() => {
    setSubmitted((already) => {
      if (already) return already
      pause()
      progress.recordPractice(dayNumber, scorePct, answers)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return true
    })
  }, [pause, progress, dayNumber, scorePct, answers])

  useEffect(() => {
    submitRef.current = handleSubmit
  }, [handleSubmit])

  // Warn before leaving while a timed test is in progress.
  useEffect(() => {
    if (!running || submitted) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [running, submitted])

  const handleSubmitClick = () => {
    if (answeredCount < total) {
      const ok = window.confirm(
        `Bạn còn ${total - answeredCount} câu chưa trả lời. Vẫn nộp bài?`,
      )
      if (!ok) return
    }
    handleSubmit()
  }

  const handleRetry = () => {
    setSubmitted(false)
    setAnswers({})
    reset()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSelect = (id: string, key: OptionKey) => {
    if (submitted) return
    setAnswers((prev) => ({ ...prev, [id]: key }))
  }

  if (submitted) {
    return (
      <ResultPanel
        questions={questions}
        answers={answers}
        correctCount={correctCount}
        scorePct={scorePct}
        bestScorePct={progress.getBestScore(dayNumber)}
        onRetry={handleRetry}
      />
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* Left: media (optional) + questions */}
      <div className="space-y-4">
        {content.audioUrl && <AudioPlayer src={content.audioUrl} />}
        {content.pdfUrl && (
          <div className="h-[60vh] min-h-[420px]">
            <PdfViewer url={content.pdfUrl} title={`Đề thi — ${title}`} />
          </div>
        )}

        {total === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center text-sm text-slate-500">
            Bài luyện đề này chưa có câu hỏi. Nội dung sẽ sớm được cập nhật.
          </div>
        ) : (
          passageGroups.map((g, gi) => (
            <div key={gi} className="space-y-4">
              {g.passage &&
                (content.listening ? (
                  <ListeningPlayer
                    script={g.passage}
                    label={`Bài nghe ${gi + 1} (câu ${g.items[0].index + 1}–${g.items[g.items.length - 1].index + 1})`}
                    allowTranscript={
                      !isAudioOnlyListening(g.items[0].q, content.listening)
                    }
                  />
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 text-[15px] leading-relaxed text-slate-800 shadow-card">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-700">
                      Đoạn văn (câu {g.items[0].index + 1}–
                      {g.items[g.items.length - 1].index + 1})
                    </p>
                    <div className="whitespace-pre-line">{g.passage}</div>
                  </div>
                ))}
              {g.items.map(({ q, index }) => (
                <TestQuestion
                  key={q.id}
                  question={q}
                  index={index}
                  selected={answers[q.id]}
                  onSelect={(key) => handleSelect(q.id, key)}
                  hideOptionText={isAudioOnlyListening(q, content.listening)}
                />
              ))}
            </div>
          ))
        )}
      </div>

      {/* Right: timer + navigator + submit */}
      <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <CountdownTimer
          formatted={formatted}
          secondsLeft={secondsLeft}
          totalSeconds={totalSeconds}
          running={running}
          onStart={start}
          onPause={pause}
        />

        {total > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
              <ListChecks className="h-4 w-4 text-brand-600" />
              Bảng câu hỏi
            </h3>
            <div className="grid grid-cols-6 gap-1.5">
              {questions.map((q, index) => {
                const done = Boolean(answers[q.id])
                return (
                  <a
                    key={q.id}
                    href={`#cau-${index + 1}`}
                    className={cn(
                      'grid h-9 place-items-center rounded-lg text-sm font-semibold transition-colors',
                      done
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                    )}
                  >
                    {index + 1}
                  </a>
                )
              })}
            </div>
            <p className="mt-3 text-center text-sm text-slate-500">
              Đã trả lời{' '}
              <span className="font-semibold text-slate-800">
                {answeredCount}/{total}
              </span>{' '}
              câu
            </p>
            <button
              type="button"
              onClick={handleSubmitClick}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white shadow-card transition-colors hover:bg-brand-700"
            >
              <Send className="h-4 w-4" />
              Nộp bài
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
