import { useEffect, useMemo, useState } from 'react'
import { BookmarkPlus, Check, Eye, EyeOff, Headphones, Play, Square } from 'lucide-react'
import { cn } from '../../../lib/cn'
import { cancelSpeech, speakTurns, toSpokenTurns, warmVoices } from '../../../lib/speech'
import { SpeedControl } from '../../common/SpeedControl'
import { saveWord } from '../../../lib/savedWordsApi'

interface ListeningPlayerProps {
  /** The spoken script (may contain "Man:"/"Woman:" speaker labels). */
  script: string
  label?: string
  /** When false, the "Xem lời thoại" button is hidden — used for Part 1/2 where
   *  the script IS the spoken answer choices (would spoil the test). */
  allowTranscript?: boolean
}

const SPEAKER_TAG: Record<string, string> = {
  man: 'Nam', m: 'Nam', male: 'Nam', boy: 'Nam',
  woman: 'Nữ', w: 'Nữ', female: 'Nữ', girl: 'Nữ',
}
const cleanWord = (w: string) => w.toLowerCase().replace(/[^a-z'-]/g, '')

export function ListeningPlayer({
  script,
  label = 'Bài nghe',
  allowTranscript = true,
}: ListeningPlayerProps) {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const [playing, setPlaying] = useState(false)
  const [showScript, setShowScript] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const [saved, setSaved] = useState<string | null>(null)

  const turns = useMemo(() => toSpokenTurns(script), [script])

  useEffect(() => {
    if (!supported) return
    warmVoices()
    return () => cancelSpeech()
  }, [supported])

  useEffect(() => {
    if (!supported || !playing) return
    const id = setInterval(() => {
      if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
        setPlaying(false)
        setActiveIdx(-1)
      }
    }, 400)
    return () => clearInterval(id)
  }, [supported, playing])

  const stop = () => {
    cancelSpeech()
    setPlaying(false)
    setActiveIdx(-1)
  }
  const play = () => {
    if (!supported) return
    // Giọng riêng từng nhân vật + báo câu đang đọc để highlight transcript đồng bộ.
    speakTurns(turns, undefined, setActiveIdx)
    setPlaying(true)
    setShowScript(true)
  }

  const onSaveWord = async (w: string, ctx: string) => {
    const word = cleanWord(w)
    if (!word) return
    try {
      await saveWord(word, ctx)
      setSaved(word)
      window.setTimeout(() => setSaved((s) => (s === word ? null : s)), 1600)
    } catch {
      /* im lặng */
    }
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
              'press inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold',
              playing ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' : 'bg-brand-600 text-white hover:bg-brand-700',
            )}
          >
            {playing ? (
              <><Square className="h-3.5 w-3.5" /> Dừng</>
            ) : (
              <><Play className="h-3.5 w-3.5" /> Nghe</>
            )}
          </button>
        ) : (
          <span className="text-xs text-amber-600">Trình duyệt không hỗ trợ đọc giọng nói.</span>
        )}

        {supported && <SpeedControl />}

        {allowTranscript && (
          <button
            type="button"
            onClick={() => setShowScript((s) => !s)}
            className="press ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            {showScript ? <><EyeOff className="h-3.5 w-3.5" /> Ẩn lời thoại</> : <><Eye className="h-3.5 w-3.5" /> Xem lời thoại</>}
          </button>
        )}
      </div>

      {allowTranscript && showScript && (
        <div className="mt-3 origin-top animate-fade-slide-down space-y-2 rounded-xl bg-slate-50 p-4">
          <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <BookmarkPlus className="h-3.5 w-3.5" /> Bấm vào một từ để lưu vào sổ tay ôn sau. Câu đang đọc được tô sáng.
          </p>
          {turns.map((t, i) => (
            <p
              key={i}
              className={cn(
                'rounded-lg px-2 py-1 text-sm leading-relaxed transition-colors',
                i === activeIdx ? 'bg-brand-100 text-slate-900' : 'text-slate-700',
              )}
            >
              {t.speaker && SPEAKER_TAG[t.speaker] && (
                <span className="mr-1.5 text-xs font-bold text-brand-500">{SPEAKER_TAG[t.speaker]}:</span>
              )}
              {t.text.split(/(\s+)/).map((tok, k) =>
                /\S/.test(tok) ? (
                  <button
                    key={k}
                    type="button"
                    onClick={() => onSaveWord(tok, t.text)}
                    className="rounded px-0.5 hover:bg-amber-200 hover:text-amber-900"
                    title="Lưu từ này"
                  >
                    {tok}
                  </button>
                ) : (
                  <span key={k}>{tok}</span>
                ),
              )}
            </p>
          ))}
        </div>
      )}

      {saved && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-pop-in rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-card-lg">
          <span className="flex items-center gap-1.5">
            <Check className="h-4 w-4" /> Đã lưu “{saved}” vào sổ tay
          </span>
        </div>
      )}
    </div>
  )
}
