// Tốc độ phát dùng CHUNG cho mọi nơi nghe (audio thật + TTS). Lưu trong bộ nhớ
// phiên (đồng bộ mọi trình phát ngay lập tức); mặc định 1× mỗi lần mở app.

import { useEffect, useState } from 'react'

export const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const

let rate = 1
const listeners = new Set<() => void>()

export function getPlaybackRate(): number {
  return rate
}

export function setPlaybackRate(r: number): void {
  rate = r
  listeners.forEach((l) => l())
}

/** Nghe tốc độ hiện tại + hàm đổi; re-render khi tốc độ thay đổi ở bất kỳ đâu. */
export function usePlaybackRate(): [number, (r: number) => void] {
  const [r, setR] = useState(rate)
  useEffect(() => {
    const l = () => setR(rate)
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  }, [])
  return [r, setPlaybackRate]
}
