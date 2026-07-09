// Deterministic blank selection for dictation. The same sentence + level always
// yields the same blanks, so a reload doesn't shuffle the exercise.
//
// Levels: 1 Dễ (~25% từ chính) · 2 Trung bình (~50%) · 3 Khó (~85%) · 4 Chép cả câu.

export type DictLevel = 1 | 2 | 3 | 4

export const LEVEL_LABEL: Record<DictLevel, string> = {
  1: 'Dễ',
  2: 'Trung bình',
  3: 'Khó',
  4: 'Chép cả câu',
}

const RATIO: Record<Exclude<DictLevel, 4>, number> = { 1: 0.25, 2: 0.5, 3: 0.85 }

/** Very common words that carry little listening value. */
const STOP = new Set([
  'a', 'an', 'the', 'of', 'to', 'in', 'on', 'at', 'is', 'are', 'was', 'were',
  'be', 'and', 'or', 'for', 'it', 'i', 'you', 'he', 'she', 'we', 'they', 'this',
  'that', 'my', 'your', 'so', 'as', 'but', 'if', 'do', 'did', 'does', 'has',
  'have', 'had', 'will', 'would', 'can', 'could', 'me', 'him', 'her', 'them',
  'our', 'its', 'not', 'no', 'yes', 'up', 'out', 'by', 'with', 'from',
])

export interface Token {
  text: string
  /** true when the token is a real word (candidate for blanking) */
  isWord: boolean
}

const WORD_RE = /[A-Za-z][A-Za-z'-]*/g

export function tokenize(text: string): Token[] {
  const out: Token[] = []
  let last = 0
  for (const m of text.matchAll(WORD_RE)) {
    const at = m.index ?? 0
    if (at > last) out.push({ text: text.slice(last, at), isWord: false })
    out.push({ text: m[0], isWord: true })
    last = at + m[0].length
  }
  if (last < text.length) out.push({ text: text.slice(last), isWord: false })
  return out
}

/** Normalized form used when comparing a typed word to the expected one. */
export function normalizeWord(s: string): string {
  return s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[^a-z'-]/g, '')
    .trim()
}

/** Normalized form for whole-sentence comparison (level 4). */
export function normalizeSentence(s: string): string {
  return s
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[^a-z0-9' ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Token indices to blank out. Picks the most "content-bearing" words first
 * (longest, non-stopword), then restores reading order — deterministic.
 */
export function selectBlanks(text: string, level: DictLevel): number[] {
  if (level === 4) return []
  const tokens = tokenize(text)
  const wordIdx = tokens.map((t, i) => (t.isWord ? i : -1)).filter((i) => i >= 0)
  if (wordIdx.length === 0) return []

  let candidates = wordIdx.filter((i) => {
    const w = tokens[i].text.toLowerCase()
    return w.length >= 3 && !STOP.has(w)
  })
  if (candidates.length === 0) candidates = wordIdx.filter((i) => tokens[i].text.length >= 2)
  if (candidates.length === 0) candidates = wordIdx

  const n = Math.max(1, Math.round(candidates.length * RATIO[level]))
  const ranked = [...candidates].sort((a, b) => {
    const la = tokens[a].text.length
    const lb = tokens[b].text.length
    if (lb !== la) return lb - la
    return a - b
  })
  return ranked.slice(0, n).sort((a, b) => a - b)
}

export function isBlankCorrect(typed: string, expected: string): boolean {
  const t = normalizeWord(typed)
  return t.length > 0 && t === normalizeWord(expected)
}

export function isSentenceCorrect(typed: string, expected: string): boolean {
  return normalizeSentence(typed) === normalizeSentence(expected)
}
