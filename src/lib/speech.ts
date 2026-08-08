// Engine phát tiếng (Web Speech API) cho toàn app.
//
// Ba việc quan trọng nó lo:
//   1) TÁCH nội dung thành từng câu, GIỮ nhãn người nói (để đổi giọng theo nhân vật).
//   2) CHỌN GIỌNG chất lượng cao (tránh giọng "rè" mặc định), và giọng KHÁC NHAU
//      cho các nhân vật khác nhau trong hội thoại (Part 3/4).
//   3) Phát ỔN ĐỊNH trên iOS Safari: xếp toàn bộ câu vào hàng đợi CÙNG LÚC (không
//      nối bằng onend — iOS hay bỏ dở sau câu đầu), kèm keep-alive chống iOS tự dừng.

import { getPlaybackRate } from './playback'

export interface SpeechTurn {
  text: string
  /** Nhãn người nói đã chuẩn hoá (vd 'man', 'woman', 'w', tên...) — cùng nhãn = cùng giọng. */
  speaker?: string
}

// ---- Tách câu / lượt thoại ---------------------------------------------------

// Nhãn người nói: BẮT BUỘC dấu ":" -> không ăn nhầm "Mr." hay câu bắt đầu "A.".
const SPEAKER = /^(?:[mw]|man|woman|male|female|boy|girl|speaker\s*\d*|narrator|q|a)\s*\d*\s*:\s*/i
// Bắt CHÍNH nhãn (để phân biệt nhân vật) — nhãn ngắn đứng trước ": ".
const SPEAKER_LABEL = /^([A-Za-z][A-Za-z0-9 .'-]{0,20}?)\s*:\s+/

function stripSpeaker(line: string): string {
  return line.replace(SPEAKER, '').trim()
}
function labelOf(line: string): string | undefined {
  const m = line.match(SPEAKER_LABEL)
  if (!m) return undefined
  const raw = m[1].trim().toLowerCase()
  // chỉ coi là nhãn người nói nếu ngắn gọn (không phải cả câu lỡ có dấu ":")
  return raw.length <= 20 ? raw : undefined
}

// Viết tắt danh xưng: KHÔNG tách câu ngay sau (tránh "Mr. [nghỉ] Kim").
const ABBREV = /(?:^|\s)(?:mr|mrs|ms|dr|prof|st|ave|rd|inc|ltd|co|corp|dept|no|vs|jr|sr|etc)\.$/i

/** Tách một đoạn thành các câu (theo dấu kết câu), GIỮ TẤT CẢ (chỉ tách, không bỏ). */
function splitSentences(text: string): string[] {
  const raw = text
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
  const out: string[] = []
  for (const piece of raw) {
    if (out.length > 0 && ABBREV.test(out[out.length - 1])) out[out.length - 1] += ' ' + piece
    else out.push(piece)
  }
  return out
}

/**
 * Tách script thành các LƯỢT NÓI (mỗi câu một phần tử, giữ nhãn người nói).
 * BẢO ĐẢM chỉ tách, không bỏ sót nội dung (chỉ lược nhãn người nói + mốc (A)).
 */
export function toSpokenTurns(raw: string | null | undefined): SpeechTurn[] {
  if (!raw) return []
  const text = raw.trim()

  // 1) Một dòng có mốc (A)/(B)/(C)/(D) -> tách ở mốc, không có người nói.
  if (/\([A-D]\)/.test(text) && !/\n/.test(text)) {
    const first = text.search(/\([A-D]\)/)
    const preamble = text.slice(0, first).trim()
    const parts = text.slice(first).split(/\s*\([A-D]\)\s*/).map((s) => s.trim()).filter(Boolean)
    const lines: string[] = []
    if (preamble && !/look at (the )?picture|listen to/i.test(preamble)) lines.push(preamble)
    return [...lines, ...parts].flatMap(splitSentences).map((t) => ({ text: t }))
  }

  // 2) Nhiều dòng (hội thoại) -> mỗi lượt: lấy nhãn người nói, tách câu, giữ hết.
  const byLine = text.split(/\n+/).map((l) => l.trim()).filter(Boolean)
  if (byLine.length > 1) {
    return byLine.flatMap((l) => {
      const speaker = labelOf(l)
      return splitSentences(stripSpeaker(l)).map((t) => ({ text: t, speaker }))
    })
  }

  // 3) Một dòng thường -> tách câu, không người nói.
  return splitSentences(stripSpeaker(text)).map((t) => ({ text: t }))
}

/** Chỉ lấy các câu (bỏ nhãn) — dùng cho công cụ kiểm tra & nơi không cần đổi giọng. */
export function toSpokenLines(raw: string | null | undefined): string[] {
  return toSpokenTurns(raw).map((t) => t.text)
}

// ---- Chọn giọng chất lượng cao ----------------------------------------------

let voiceCache: SpeechSynthesisVoice[] = []
function allVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return []
  const v = window.speechSynthesis.getVoices()
  if (v.length) voiceCache = v
  return voiceCache
}

/** Nạp sẵn danh sách giọng (một số trình duyệt nạp bất đồng bộ). */
export function warmVoices(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  allVoices()
  window.speechSynthesis.onvoiceschanged = () => allVoices()
}

// Tên giọng CHẤT LƯỢNG CAO (ưu tiên) và giọng KÉM/hài hước (tránh -> hết "rè").
const GOOD =
  /google|natural|neural|premium|enhanced|online|siri|aria|jenny|guy|ryan|sonia|libby|michelle|samantha|daniel|karen|moira|tessa|serena|allison|ava|nathan|noah|emma|amelia|oliver|arthur/i
const BAD =
  /compact|eloquence|novelty|fred|albert|zarvox|organ|cellos|trinoids|bubbles|boing|bad news|good news|whisper|bells|wobble|superstar|jester|junior|kathy|ralph|deranged/i
const FEMALE =
  /female|samantha|karen|moira|tessa|serena|allison|ava|susan|zira|aria|jenny|libby|sonia|emma|amelia|victoria|catherine|fiona|kate|hazel|michelle|joanna|salli|kimberly/i
const MALE =
  /\bmale\b|daniel|david|mark|alex|guy|ryan|george|james|arthur|oliver|thomas|aaron|nathan|noah|rishi|gordon|lee|fred|tom|matthew|brian/i

function score(v: SpeechSynthesisVoice): number {
  let s = 0
  if (GOOD.test(v.name)) s += 10
  if (BAD.test(v.name)) s -= 20
  if (/en[-_]us/i.test(v.lang)) s += 3
  else if (/en[-_]gb/i.test(v.lang)) s += 2
  if (v.localService === false) s += 2 // giọng mạng thường tự nhiên hơn
  if (v.default) s += 1
  return s
}

function englishVoices(): SpeechSynthesisVoice[] {
  return allVoices()
    .filter((v) => /^en\b|^en[-_]/i.test(v.lang))
    .sort((a, b) => score(b) - score(a))
}

function gender(v: SpeechSynthesisVoice): 'f' | 'm' | null {
  if (FEMALE.test(v.name)) return 'f'
  if (MALE.test(v.name)) return 'm'
  return null
}

/** Giọng tốt nhất để đọc đơn (từ vựng, flashcard) — rõ nét, ưu tiên giọng nữ chuẩn. */
export function bestVoice(): SpeechSynthesisVoice | undefined {
  const en = englishVoices()
  return en.find((v) => gender(v) === 'f') ?? en[0]
}

/** Giọng nữ / nam tốt nhất (đã lọc chất lượng). */
function pools(): { females: SpeechSynthesisVoice[]; males: SpeechSynthesisVoice[]; any: SpeechSynthesisVoice[] } {
  const en = englishVoices()
  return {
    females: en.filter((v) => gender(v) === 'f'),
    males: en.filter((v) => gender(v) === 'm'),
    any: en,
  }
}

/** Gán MỖI nhân vật một giọng KHÁC NHAU (đúng giới tính nếu nhãn cho biết). */
function assignVoices(speakers: (string | undefined)[]): Map<string, SpeechSynthesisVoice | undefined> {
  const { females, males, any } = pools()
  const uniq: string[] = []
  for (const s of speakers) {
    const key = s ?? ''
    if (!uniq.includes(key)) uniq.push(key)
  }
  const map = new Map<string, SpeechSynthesisVoice | undefined>()
  let fi = 0
  let mi = 0
  let alt = true
  const nextF = () => females[fi++ % Math.max(1, females.length)] ?? any[fi % Math.max(1, any.length)]
  const nextM = () => males[mi++ % Math.max(1, males.length)] ?? any[(females.length + mi) % Math.max(1, any.length)]
  for (const key of uniq) {
    const g = /woman|female|girl|^w$|^w\d|^f/.test(key) ? 'f' : /man|male|boy|^m$|^m\d/.test(key) ? 'm' : null
    let v: SpeechSynthesisVoice | undefined
    if (g === 'f') v = nextF()
    else if (g === 'm') v = nextM()
    else {
      v = alt ? nextF() : nextM()
      alt = !alt
    }
    map.set(key, v ?? any[0])
  }
  return map
}

// ---- Phát ổn định (iOS-safe) -------------------------------------------------

let keepAlive: ReturnType<typeof setInterval> | null = null
function startKeepAlive() {
  stopKeepAlive()
  // iOS Safari tự dừng speechSynthesis sau ~15s; pause+resume định kỳ để chống dừng.
  keepAlive = setInterval(() => {
    const s = window.speechSynthesis
    if (!s.speaking && !s.pending) {
      stopKeepAlive()
      return
    }
    s.pause()
    s.resume()
  }, 8000)
}
function stopKeepAlive() {
  if (keepAlive) {
    clearInterval(keepAlive)
    keepAlive = null
  }
}

export function cancelSpeech(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  stopKeepAlive()
  window.speechSynthesis.cancel()
}

/** Đọc một câu đơn (từ vựng, flashcard) bằng giọng chất lượng cao. */
export function speakOne(text: string, rate = getPlaybackRate()): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text.trim()) return
  const synth = window.speechSynthesis
  synth.cancel()
  const u = new SpeechSynthesisUtterance(text.trim())
  u.lang = 'en-US'
  u.rate = rate
  u.pitch = 1
  const v = bestVoice()
  if (v) u.voice = v
  synth.speak(u)
}

/**
 * Đọc một dãy LƯỢT THOẠI: xếp TẤT CẢ vào hàng đợi cùng lúc (iOS đọc hết, không
 * rơi câu), mỗi nhân vật một giọng riêng. Câu không có người nói -> giọng tốt nhất.
 */
export function speakTurns(
  turns: SpeechTurn[],
  rate = getPlaybackRate(),
  onIndex?: (i: number) => void,
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  const synth = window.speechSynthesis
  synth.cancel()
  stopKeepAlive()
  const clean = turns.map((t) => ({ text: t.text.trim(), speaker: t.speaker })).filter((t) => t.text)
  if (clean.length === 0) return
  const voiceBy = assignVoices(clean.map((t) => t.speaker))
  const fallback = bestVoice()
  clean.forEach((t, i) => {
    const u = new SpeechSynthesisUtterance(t.text)
    u.lang = 'en-US'
    u.rate = rate
    u.pitch = 1
    const v = t.speaker != null ? voiceBy.get(t.speaker) : fallback
    if (v ?? fallback) u.voice = (v ?? fallback) as SpeechSynthesisVoice
    // Báo câu đang đọc (để highlight transcript đồng bộ).
    if (onIndex) {
      u.onstart = () => onIndex(i)
      if (i === clean.length - 1) u.onend = () => onIndex(-1)
    }
    synth.speak(u) // xếp hàng đợi ngay, KHÔNG chờ onend
  })
  startKeepAlive()
}
