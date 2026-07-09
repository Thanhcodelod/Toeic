import { useCallback, useEffect, useState } from 'react'
import { Layout } from './components/Layout'
import { DayView } from './components/DayView'
import { MergeProgressPrompt } from './components/MergeProgressPrompt'
import { VocabReviewPage } from './components/vocab/VocabReviewPage'
import { DictationPage } from './components/dictation/DictationPage'
import { useDays } from './hooks/useDays'
import { useProgress } from './hooks/useProgress'
import { TOTAL_DAYS } from './data/constants'

type View = 'course' | 'vocab' | 'dictation'

function clampDay(value: number): number {
  if (Number.isNaN(value)) return 1
  return Math.min(Math.max(Math.round(value), 1), TOTAL_DAYS)
}

function readDayFromUrl(): number {
  if (typeof window === 'undefined') return 1
  const raw = new URLSearchParams(window.location.search).get('day')
  return raw ? clampDay(Number(raw)) : 1
}

function readViewFromUrl(): View {
  if (typeof window === 'undefined') return 'course'
  const v = new URLSearchParams(window.location.search).get('view')
  return v === 'vocab' || v === 'dictation' ? v : 'course'
}

export default function App() {
  const progress = useProgress()
  const { days, loading: daysLoading, error: daysError } = useDays()
  const [selectedDay, setSelectedDayState] = useState<number>(readDayFromUrl)
  const [view, setView] = useState<View>(readViewFromUrl)

  const selectDay = useCallback((day: number) => {
    const next = clampDay(day)
    setSelectedDayState(next)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('day', String(next))
      url.searchParams.delete('view')
      window.history.pushState({ day: next }, '', url)
    }
    setView('course')
  }, [])

  const selectView = useCallback((next: View) => {
    setView(next)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (next === 'course') url.searchParams.delete('view')
      else url.searchParams.set('view', next)
      window.history.pushState({ view: next }, '', url)
    }
  }, [])

  useEffect(() => {
    const onPop = () => {
      setSelectedDayState(readDayFromUrl())
      setView(readViewFromUrl())
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  if (view === 'vocab') {
    return <VocabReviewPage onBack={() => selectView('course')} />
  }
  if (view === 'dictation') {
    return <DictationPage onBack={() => selectView('course')} />
  }

  return (
    <>
      <MergeProgressPrompt progress={progress} />
      <Layout
        days={days}
        daysLoading={daysLoading}
        daysError={daysError}
        progress={progress}
        selectedDay={selectedDay}
        onSelectDay={selectDay}
        onOpenVocab={() => selectView('vocab')}
        onOpenDictation={() => selectView('dictation')}
      >
        <DayView
          key={selectedDay}
          dayNumber={selectedDay}
          progress={progress}
          onSelectDay={selectDay}
        />
      </Layout>
    </>
  )
}
