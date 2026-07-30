import { useCallback } from 'react'
import { toSpokenLines } from '../lib/speech'

/**
 * Speaks English text using the browser's built-in speech synthesis
 * (Web Speech API) — no audio files or storage needed.
 */
export function useSpeak() {
  const supported =
    typeof window !== 'undefined' && 'speechSynthesis' in window

  const speak = useCallback(
    (text: string, lang = 'en-US') => {
      if (!supported) return
      const synth = window.speechSynthesis
      synth.cancel() // stop any ongoing utterance
      const utter = new SpeechSynthesisUtterance(text)
      utter.lang = lang
      utter.rate = 0.9
      const voice = synth
        .getVoices()
        .find((v) => v.lang.toLowerCase().startsWith('en'))
      if (voice) utter.voice = voice
      synth.speak(utter)
    },
    [supported],
  )

  /**
   * Đọc TỪNG CÂU thành từng lượt riêng (có ngắt nghỉ giữa các câu) — dùng cho
   * bài nghe Part 1/2 (câu hỏi + các đáp án) và Part 3/4 (hội thoại nhiều dòng),
   * thay vì đọc gộp cả khối. Nhận sẵn một mảng câu, hoặc một chuỗi script để tự tách.
   */
  const speakSequence = useCallback(
    (input: string | string[], lang = 'en-US') => {
      if (!supported) return
      const lines = Array.isArray(input)
        ? input.map((l) => l.trim()).filter(Boolean)
        : toSpokenLines(input)
      const synth = window.speechSynthesis
      synth.cancel()
      const voice = synth
        .getVoices()
        .find((v) => v.lang.toLowerCase().startsWith('en'))
      let i = 0
      const next = () => {
        if (i >= lines.length) return
        const u = new SpeechSynthesisUtterance(lines[i])
        u.lang = lang
        u.rate = 0.9
        if (voice) u.voice = voice
        u.onend = () => { i += 1; next() }
        u.onerror = () => { i += 1; next() }
        synth.speak(u)
      }
      next()
    },
    [supported],
  )

  return { speak, speakSequence, supported }
}
