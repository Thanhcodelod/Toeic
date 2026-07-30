// Tách một đoạn script nghe thành CÁC CÂU NÓI RIÊNG để đọc tuần tự (mỗi câu một
// lượt, có ngắt nghỉ) — thay vì đọc gộp cả khối. Xử lý cả 3 dạng dữ liệu:
//   - nhiều dòng (Part 3/4, hoặc script đã tách sẵn): mỗi dòng một câu, bỏ nhãn
//     người nói "M:/W:/Man:/Woman:/Speaker 1:".
//   - một dòng có dấu "(A) … (B) … (C) … (D) …" (Part 1/2 kiểu cũ): tách ở các mốc;
//     bỏ lời dẫn "Look at the picture…"; giữ câu hỏi Part 2 làm câu đầu.
//   - một dòng không mốc: tách theo dấu kết câu.

const SPEAKER = /^(?:[MW]|man|woman|male|female|speaker\s*\d*|narrator|q|a)\s*\d*\s*[:.]\s*/i

function stripSpeaker(line: string): string {
  return line.replace(SPEAKER, '').trim()
}

export function toSpokenLines(raw: string | null | undefined): string[] {
  if (!raw) return []
  const text = raw.trim()

  // 1) Có mốc (A)/(B)/(C)/(D) trên một dòng -> tách ở mốc.
  if (/\([A-D]\)/.test(text) && !/\n/.test(text)) {
    const first = text.search(/\([A-D]\)/)
    const preamble = text.slice(0, first).trim()
    const parts = text
      .slice(first)
      .split(/\s*\([A-D]\)\s*/)
      .map((s) => s.trim())
      .filter(Boolean)
    const lines: string[] = []
    // Lời dẫn "Look at the picture and listen." là câu mồi -> bỏ. Câu hỏi Part 2 -> giữ.
    if (preamble && !/look at (the )?picture|listen to/i.test(preamble)) lines.push(preamble)
    return [...lines, ...parts]
  }

  // 2) Nhiều dòng -> mỗi dòng một câu, bỏ nhãn người nói.
  const byLine = text.split(/\n+/).map((l) => l.trim()).filter(Boolean)
  if (byLine.length > 1) return byLine.map(stripSpeaker).filter(Boolean)

  // 3) Một dòng, không mốc -> tách theo câu.
  return stripSpeaker(text)
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
}
