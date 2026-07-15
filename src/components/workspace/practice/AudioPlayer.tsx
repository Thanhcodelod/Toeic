import { useEffect, useRef, useState } from 'react'
import { Headphones, Pause, Play, Volume2 } from 'lucide-react'

interface AudioPlayerProps {
  src: string
  title?: string
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export function AudioPlayer({ src, title = 'Audio bài nghe' }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [error, setError] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => setCurrent(audio.currentTime)
    const onMeta = () => setDuration(audio.duration)
    const onEnd = () => setPlaying(false)
    const onErr = () => setError(true)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('ended', onEnd)
    audio.addEventListener('error', onErr)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('ended', onEnd)
      audio.removeEventListener('error', onErr)
    }
  }, [])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      void audio.play().then(
        () => setPlaying(true),
        () => setError(true),
      )
    }
  }

  const seek = (value: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = value
    setCurrent(value)
  }

  const changeVolume = (value: number) => {
    const audio = audioRef.current
    if (audio) audio.volume = value
    setVolume(value)
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Headphones className="h-4 w-4 text-brand-600" />
        {title}
      </div>

      <audio ref={audioRef} src={src} preload="metadata" />

      {error ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Không tải được audio mẫu. Khi thêm file nghe thật, trình phát sẽ hoạt
          động bình thường.
        </p>
      ) : (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggle}
            className="press grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-600 text-white shadow-card hover:bg-brand-700"
            aria-label={playing ? 'Tạm dừng' : 'Phát'}
          >
            {playing ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 pl-0.5" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={current}
              onChange={(e) => seek(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-600"
              aria-label="Tua audio"
            />
            <div className="mt-1 flex justify-between text-[11px] tabular-nums text-slate-500">
              <span>{formatTime(current)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="hidden items-center gap-1.5 sm:flex">
            <Volume2 className="h-4 w-4 text-slate-400" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => changeVolume(Number(e.target.value))}
              className="h-1.5 w-16 cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-600"
              aria-label="Âm lượng"
            />
          </div>
        </div>
      )}
    </div>
  )
}
