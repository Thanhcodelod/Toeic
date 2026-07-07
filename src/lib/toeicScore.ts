// Approximate TOEIC raw-correct -> scaled-score (5–495 per section) conversion.
// TOEIC's official table varies per test; this is a widely-used ESTIMATE. Label
// results as "ước lượng" in the UI.

type Anchor = [correct: number, scaled: number]

const LC_ANCHORS: Anchor[] = [
  [0, 5], [10, 45], [20, 95], [30, 160], [40, 230],
  [50, 290], [60, 350], [70, 400], [80, 445], [90, 480],
  [96, 495], [100, 495],
]

const RC_ANCHORS: Anchor[] = [
  [0, 5], [10, 30], [20, 70], [30, 120], [40, 170],
  [50, 225], [60, 290], [70, 345], [80, 400], [90, 455],
  [96, 490], [100, 495],
]

function interpolate(anchors: Anchor[], correct: number): number {
  const x = Math.max(0, Math.min(100, correct))
  if (x <= anchors[0][0]) return anchors[0][1]
  for (let i = 1; i < anchors.length; i++) {
    if (x <= anchors[i][0]) {
      const [x0, y0] = anchors[i - 1]
      const [x1, y1] = anchors[i]
      const t = (x - x0) / (x1 - x0)
      return y0 + (y1 - y0) * t
    }
  }
  return anchors[anchors.length - 1][1]
}

function round5(v: number): number {
  return Math.max(5, Math.min(495, Math.round(v / 5) * 5))
}

export function listeningScaled(correct: number): number {
  return round5(interpolate(LC_ANCHORS, correct))
}

export function readingScaled(correct: number): number {
  return round5(interpolate(RC_ANCHORS, correct))
}
