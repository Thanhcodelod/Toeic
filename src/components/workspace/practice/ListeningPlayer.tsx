import { useEffect, useRef, useState } from 'react'
import { Eye, EyeOff, Headphones, Play, Square } from 'lucide-react'
import { cn } from '../../../lib/cn'

interface ListeningPlayerProps {
  /** The spoken script (may contain "Man:"/"Woman:" speaker labels). */
  script: string
  label?: string
  /** When false, the "Xem lời thoại" button is hidden — used for Part 1/2 where
   *  the script IS the spoken answer choices (would spoil the test). */
  allowTranscript?: boolean
}

interface Line {
  speaker: string
  text: string
}

function parseLines(script: string): Line[] {
  return script
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^([A-Za-z][A-Za-z .]{0,14}?)\s*\d*\s*:\s*(.*)$/)
      if (m && m[2]) return { speaker: m[1].trim().toLowerCase(), text: m[2] }
      return { speaker: '', text: line }
    })
}

function pickVoice(speaker: string): SpeechSynthesisVoice | undefined {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  const en = window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang.toLowerCase().startsWith('en'))
  if (en.length === 0) return
  const female =
    en.find((v) => /female|zira|samantha|susan|hazel|aria|jenny/i.test(v.name)) ??
    en[0]
  const male =
    en.find((v) => /male|david|mark|daniel|george|guy|ryan/i.test(v.name)) ??
    en[1] ??
    en[0]
  if (speaker.startsWith('woman') || speaker.startsWith('female')) return female
  if (speaker.startsWith('man') || speaker.startsWith('male')) return male
  return en[0]
}

export function ListeningPlayer({
  script,
  label = 'Bài nghe',
  allowTranscript = true,
}: ListeningPlayerProps) {
  const supported =
    typeof window !== 'undefined' && 'speechSynthesis' in window
  const [playing, setPlaying] = useState(false)
  const [showScript, setShowScript] = useState(false)
  const stoppedRef = useRef(false)
  const lines = parseLines(script)

  // Warm up the voice list (loads async in some browsers).
  useEffect(() => {
    if (!supported) return
    window.speechSynthesis.getVoices()
    const handler = () => window.speechSynthesis.getVoices()
    window.speechSynthesis.addEventListener('voiceschanged', handler)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handler)
      window.speechSynthesis.cancel()
    }
  }, [supported])

  const stop = () => {
    stoppedRef.current = true
    if (supported) window.speechSynthesis.cancel()
    setPlaying(false)
  }

  const play = () => {
    if (!supported) return
    window.speechSynthesis.cancel()
    stoppedRef.current = false
    setPlaying(true)

    let i = 0
    const speakNext = () => {
      if (stoppedRef.current || i >= lines.length) {
        setPlaying(false)
        return
      }
      const line = lines[i]
      const u = new SpeechSynthesisUtterance(line.text)
      u.lang = 'en-US'
      u.rate = 0.95
      const voice = pickVoice(line.speaker)
      if (voice) u.voice = voice
      u.onend = () => {
        i += 1
        speakNext()
      }
      u.onerror = () => {
        i += 1
        speakNext()
      }
      window.speechSynthesis.speak(u)
    }
    speakNext()
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Headphones className="h-4 w-4 text-brand-600" />
          {label}
        </span>

        {supported ? (
          <button
            type="button"
            onClick={playing ? stop : play}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors',
              playing
                ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                : 'bg-brand-600 text-white hover:bg-brand-700',
            )}
          >
            {playing ? (
              <>
                <Square className="h-3.5 w-3.5" /> Dừng
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" /> Nghe
              </>
            )}
          </button>
        ) : (
          <span className="text-xs text-amber-600">
            Trình duyệt không hỗ trợ đọc giọng nói.
          </span>
        )}

        {allowTranscript && (
          <button
            type="button"
            onClick={() => setShowScript((s) => !s)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            {showScript ? (
              <>
                <EyeOff className="h-3.5 w-3.5" /> Ẩn lời thoại
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" /> Xem lời thoại
              </>
            )}
          </button>
        )}
      </div>

      {allowTranscript && showScript && (
        <div className="mt-3 whitespace-pre-line rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
          {script}
        </div>
      )}
    </div>
  )
}
