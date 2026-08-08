import { useCallback, useEffect } from 'react'
import {
  cancelSpeech,
  speakOne,
  speakTurns,
  toSpokenTurns,
  warmVoices,
  type SpeechTurn,
} from '../lib/speech'

/**
 * Phát tiếng Anh bằng Web Speech API — chọn giọng chất lượng cao, đọc ổn định
 * trên iOS, và đổi giọng theo từng nhân vật khi có nhãn người nói.
 */
export function useSpeak() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  // Nạp sẵn danh sách giọng (một số trình duyệt nạp bất đồng bộ).
  useEffect(() => {
    if (supported) warmVoices()
  }, [supported])

  /** Đọc một câu/từ đơn (từ vựng, flashcard). */
  const speak = useCallback(
    (text: string) => {
      if (supported) speakOne(text)
    },
    [supported],
  )

  /**
   * Đọc một dãy câu / lượt thoại. Nhận:
   *  - string: tự tách câu (giữ nhãn người nói -> đổi giọng theo nhân vật).
   *  - string[]: các câu không phân người nói (một giọng).
   *  - SpeechTurn[]: đã kèm nhãn người nói (đổi giọng theo nhân vật).
   */
  const speakSequence = useCallback(
    (input: string | string[] | SpeechTurn[]) => {
      if (!supported) return
      let turns: SpeechTurn[]
      if (typeof input === 'string') turns = toSpokenTurns(input)
      else if (input.length > 0 && typeof input[0] === 'string')
        turns = (input as string[]).map((text) => ({ text }))
      else turns = input as SpeechTurn[]
      speakTurns(turns)
    },
    [supported],
  )

  const stop = useCallback(() => {
    if (supported) cancelSpeech()
  }, [supported])

  return { speak, speakSequence, stop, supported }
}
