import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Ear, Mic, Square, Volume2 } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useSpeak } from '../../hooks/useSpeak'

// Đề luyện nói NGUYÊN GỐC. Mỗi đề có câu mẫu để "nhại theo" (shadowing).
interface Prompt {
  id: string
  kind: 'shadow' | 'respond'
  title: string
  prompt: string
  model: string
}
const PROMPTS: Prompt[] = [
  { id: 's1', kind: 'shadow', title: 'Nhại theo — chào hỏi công sở', prompt: 'Nghe câu mẫu rồi lặp lại thật giống về ngữ điệu và nối âm.',
    model: 'Good morning, everyone. Thanks for joining the meeting on such short notice.' },
  { id: 's2', kind: 'shadow', title: 'Nhại theo — thông báo lịch', prompt: 'Nghe rồi nhại lại, chú ý nhấn trọng âm.',
    model: 'The training session has been moved to Thursday afternoon in the main conference room.' },
  { id: 'r1', kind: 'respond', title: 'Trả lời — công việc của bạn', prompt: 'Nói 30–45 giây: mô tả một ngày làm việc điển hình của bạn.',
    model: 'In a typical day, I check my emails first, then attend a short team meeting. After that, I focus on my main tasks and reply to clients in the afternoon.' },
  { id: 'r2', kind: 'respond', title: 'Nêu ý kiến — làm việc từ xa', prompt: 'Nói 45–60 giây: bạn nghĩ làm việc từ xa có tốt không? Vì sao?',
    model: 'I think working from home is a good option because it saves commuting time and helps people focus. However, teams still need to meet in person sometimes to build trust.' },
  { id: 'r3', kind: 'respond', title: 'Đề xuất giải pháp', prompt: 'Nói 30–45 giây: một lô hàng bị giao trễ. Đề xuất cách xử lý với khách hàng.',
    model: 'I would apologize to the customer, explain that the delay was caused by a supplier issue, and offer to ship the available items today with free express delivery.' },
]

export function SpeakingTab() {
  const { speak, supported } = useSpeak()
  const [active, setActive] = useState<Prompt | null>(null)
  const [recording, setRecording] = useState(false)
  const [url, setUrl] = useState<string | null>(null)
  const [micErr, setMicErr] = useState<string | null>(null)
  const recRef = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])

  const canRecord = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined'

  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])
  useEffect(() => {
    // đổi đề -> xoá bản ghi cũ
    if (url) URL.revokeObjectURL(url)
    setUrl(null)
    setMicErr(null)
  }, [active]) // eslint-disable-line react-hooks/exhaustive-deps

  const start = async () => {
    setMicErr(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunks.current = []
      const rec = new MediaRecorder(stream)
      rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data)
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunks.current, { type: 'audio/webm' })
        setUrl(URL.createObjectURL(blob))
      }
      rec.start()
      recRef.current = rec
      setRecording(true)
    } catch {
      setMicErr('Không truy cập được micro. Hãy cho phép quyền micro trong trình duyệt.')
    }
  }
  const stop = () => {
    recRef.current?.stop()
    setRecording(false)
  }

  if (!active)
    return (
      <div className="mx-auto max-w-2xl">
        <p className="mb-3 text-center text-sm text-slate-500">
          Chọn đề để luyện nói: nghe câu mẫu, tự thu âm rồi nghe lại so sánh. (Chưa chấm điểm tự động.)
        </p>
        <div className="stagger grid gap-2">
          {PROMPTS.map((p) => (
            <button key={p.id} type="button" onClick={() => setActive(p)}
              className="lift press flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-card hover:border-orange-300">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-100 text-orange-700">
                {p.kind === 'shadow' ? <Ear className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900">{p.title}</p>
                <p className="text-xs text-slate-500">{p.kind === 'shadow' ? 'Nhại theo câu mẫu' : 'Trả lời câu hỏi'}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    )

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <button type="button" onClick={() => setActive(null)} className="press inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
        <ArrowLeft className="h-4 w-4" /> Đề khác
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <p className="text-xs font-bold uppercase tracking-wide text-orange-600">{active.title}</p>
        <p className="mt-1 text-sm text-slate-700">{active.prompt}</p>
        <div className="mt-3 rounded-xl bg-slate-50 p-3">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase text-slate-400">{active.kind === 'shadow' ? 'Câu mẫu' : 'Gợi ý mẫu'}</p>
            {supported && (
              <button type="button" onClick={() => speak(active.model)} className="press ml-auto inline-flex items-center gap-1 rounded-lg bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-200">
                <Volume2 className="h-3.5 w-3.5" /> Nghe mẫu
              </button>
            )}
          </div>
          <p className="mt-1 text-sm italic text-slate-700">“{active.model}”</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-card">
        {!canRecord ? (
          <p className="text-sm text-amber-600">Trình duyệt không hỗ trợ thu âm.</p>
        ) : (
          <>
            <button
              type="button"
              onClick={recording ? stop : start}
              className={cn('press mx-auto grid h-16 w-16 place-items-center rounded-full text-white shadow-card', recording ? 'bg-rose-600 animate-pulse' : 'bg-orange-600 hover:bg-orange-700')}
            >
              {recording ? <Square className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
            </button>
            <p className="mt-2 text-sm font-medium text-slate-600">{recording ? 'Đang thu… bấm để dừng' : 'Bấm để thu âm câu trả lời của bạn'}</p>
            {micErr && <p className="mt-2 text-xs text-rose-600">{micErr}</p>}
            {url && (
              <div className="mt-3">
                <p className="mb-1 text-xs text-slate-400">Bản ghi của bạn — nghe lại và so với câu mẫu:</p>
                <audio controls src={url} className="mx-auto w-full max-w-sm" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
