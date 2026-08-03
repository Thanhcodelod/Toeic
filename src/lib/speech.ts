// Tách một đoạn script nghe thành CÁC CÂU NÓI RIÊNG để đọc tuần tự (mỗi câu một
// lượt, có ngắt nghỉ) — thay vì đọc gộp cả khối.
//
// BẢO ĐẢM: hàm này chỉ TÁCH nội dung, KHÔNG BỎ SÓT. Những thứ duy nhất bị lược là
// meta không phải lời nói: nhãn người nói đầu dòng ("Man:/Woman:/M:/W:/Speaker 1:")
// và mốc lựa chọn "(A)(B)(C)(D)" + lời dẫn "Look at the picture…". Toàn bộ CÂU CHỮ
// còn lại đều được giữ và đọc. (Có script check-listening-coverage.mjs kiểm 100%.)
//
// Ba dạng dữ liệu:
//   - nhiều dòng (Part 3/4): mỗi lượt thoại -> tách thành từng câu, giữ HẾT.
//   - một dòng có "(A) … (B) …" (Part 1/2 kiểu cũ): tách ở mốc; bỏ lời dẫn.
//   - một dòng thường: tách theo dấu kết câu.

// Nhãn người nói: BẮT BUỘC có dấu ":" (quy ước chuẩn của transcript) nên không thể
// ăn nhầm "Mr." hay câu bắt đầu bằng "A." — tránh mọi rủi ro bỏ mất nội dung.
const SPEAKER = /^(?:[mw]|man|woman|male|female|boy|girl|speaker\s*\d*|narrator|q|a)\s*\d*\s*:\s*/i

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
    return [...lines, ...parts].flatMap(splitSentences)
  }

  // 2) Nhiều dòng -> mỗi lượt: bỏ nhãn người nói rồi TÁCH TỪNG CÂU, giữ HẾT.
  const byLine = text.split(/\n+/).map((l) => l.trim()).filter(Boolean)
  if (byLine.length > 1) return byLine.flatMap((l) => splitSentences(stripSpeaker(l)))

  // 3) Một dòng thường -> tách theo câu.
  return splitSentences(stripSpeaker(text))
}

// Viết tắt danh xưng/thông dụng: KHÔNG tách câu ngay sau chúng (tránh "Mr. [nghỉ] Kim").
const ABBREV = /(?:^|\s)(?:mr|mrs|ms|dr|prof|st|ave|rd|inc|ltd|co|corp|dept|no|vs|jr|sr|etc)\.$/i

/** Tách một đoạn thành các câu (theo dấu kết câu), GIỮ TẤT CẢ (chỉ tách, không bỏ). */
function splitSentences(text: string): string[] {
  const raw = text
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
  // Gộp lại chỗ vừa tách nhầm ngay sau một viết tắt danh xưng.
  const out: string[] = []
  for (const piece of raw) {
    if (out.length > 0 && ABBREV.test(out[out.length - 1])) out[out.length - 1] += ' ' + piece
    else out.push(piece)
  }
  return out
}
