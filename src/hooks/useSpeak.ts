import { useCallback } from 'react'

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

  return { speak, supported }
}
