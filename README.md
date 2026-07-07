# Frontend — React + Vite + Tailwind

Giao diện của "Lộ trình 90 ngày đạt TOEIC 650+". Đọc dữ liệu **trực tiếp từ Supabase**
qua anon key; tiến độ + điểm cao nhất lưu ở **Local Storage**.

## Cấu hình môi trường

Tạo file `.env` (sao từ `.env.example`) trong thư mục `fe/`:

```
VITE_SUPABASE_URL=<Project URL của Supabase>
VITE_SUPABASE_ANON_KEY=<anon public key>
```

- Chạy cục bộ: dùng URL + anon key từ `npx supabase start` (trong `be/`).
- Deploy: dùng URL + anon key của project Supabase Cloud.
- `anon key` là khoá công khai, an toàn để đưa vào frontend — dữ liệu được bảo vệ bằng RLS.

## Lệnh

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # kiểm tra kiểu (tsc) + build vào dist/
npm run preview   # xem thử bản build
```

## Cấu trúc

```
src/
  lib/            supabase.ts (client) · api.ts (getDays, getDayDetail)
  hooks/          useDays · useDayDetail · useProgress · useLocalStorage · useCountdown
  data/           types.ts · constants.ts
  components/
    Layout · ProgressBar · DayView
    sidebar/      Sidebar · WeekGroup · DayItem · StatusBadge
    common/       Tabs · EmptyState
    workspace/
      DayWorkspace                      # điều hướng theo loại bài học
      grammar/    GrammarView · TheoryTab · QuizTab · QuizCard · Callout
      vocabulary/ FlashcardDeck · Flashcard
      practice/   PracticeView · TestQuestion · CountdownTimer · ResultPanel
                  AudioPlayer · PdfViewer   (dùng khi mini-test có audio/PDF)
```

## Deploy

### Vercel (khuyến nghị)
1. Đẩy repo lên GitHub.
2. Vercel → *New Project* → import repo → **Root Directory = `fe`** (tự nhận preset Vite).
3. Thêm env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
4. Deploy.

### Netlify
- Base directory: `fe`
- Build command: `npm run build`
- Publish directory: `fe/dist`
- Thêm 2 env var như trên.

### Thủ công (bất kỳ host tĩnh nào)
```bash
npm run build     # tạo thư mục dist/
# tải nội dung dist/ lên host tĩnh (Cloudflare Pages, S3, Nginx, ...)
```

## Ghi chú kỹ thuật

- **Đồng hồ đếm ngược** tính theo mốc `endTime` tuyệt đối (không lệch khi đổi tab), lưu trạng thái để làm mới trang vẫn tiếp tục; hết giờ **tự nộp bài**; cảnh báo khi rời trang lúc đang thi.
- **Flashcard** dùng `<button>` thật, hỗ trợ bàn phím (← / → chuyển thẻ, phím cách để lật), tôn trọng `prefers-reduced-motion`.
- Markdown render an toàn (không cho HTML thô) bằng `react-markdown` + `remark-gfm`.
