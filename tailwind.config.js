/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#bcd2ff',
          300: '#8eb4ff',
          400: '#598bff',
          500: '#3563ff',
          600: '#1f43f5',
          700: '#1832e1',
          800: '#1a2bb6',
          900: '#1c2b8f',
          950: '#151a52',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'Be Vietnam Pro',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.10)',
        'card-lg': '0 12px 32px -8px rgba(16, 24, 40, 0.18)',
        'card-xl': '0 24px 56px -16px rgba(16, 24, 40, 0.28)',
        glow: '0 0 0 4px rgba(53, 99, 255, 0.12)',
      },

      // ---- HỆ THỐNG CHUYỂN ĐỘNG -----------------------------------------------
      // Nguyên tắc: chỉ animate `transform` và `opacity` (chạy trên GPU, không gây
      // reflow). Vào nhanh — ra nhanh hơn. Tất cả tự tắt khi người dùng bật
      // "giảm chuyển động" (xem @media prefers-reduced-motion trong index.css).
      transitionTimingFunction: {
        // giảm tốc mạnh — cho phần tử ĐI VÀO
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
        // nảy nhẹ như lò xo — cho phản hồi "đúng rồi!", huy hiệu, popover
        spring: 'cubic-bezier(0.34, 1.4, 0.64, 1)',
        // mượt hai đầu — cho di chuyển / đổi kích thước
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        250: '250ms',
        400: '400ms',
      },

      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-slide-up': {
          from: { opacity: '0', transform: 'translate3d(0, 10px, 0)' },
          to: { opacity: '1', transform: 'translate3d(0, 0, 0)' },
        },
        'fade-slide-down': {
          from: { opacity: '0', transform: 'translate3d(0, -8px, 0)' },
          to: { opacity: '1', transform: 'translate3d(0, 0, 0)' },
        },
        'fade-slide-left': {
          from: { opacity: '0', transform: 'translate3d(16px, 0, 0)' },
          to: { opacity: '1', transform: 'translate3d(0, 0, 0)' },
        },
        // nở ra từ tâm — thẻ, hộp thoại, khối kết quả
        'pop-in': {
          from: { opacity: '0', transform: 'scale(0.94)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        // bật nảy — dấu tick "đúng rồi", huy hiệu cấp độ
        pop: {
          '0%': { transform: 'scale(0.4)', opacity: '0' },
          '60%': { transform: 'scale(1.12)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'pulse-once': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.04)' },
        },
        // trả lời SAI — lắc ngang (phản hồi bằng chuyển động, không chỉ bằng màu)
        shake: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '15%, 45%, 75%': { transform: 'translate3d(-5px, 0, 0)' },
          '30%, 60%, 90%': { transform: 'translate3d(5px, 0, 0)' },
        },
        // vòng sáng lan ra từ huy hiệu vừa đạt được
        ripple: {
          from: { opacity: '0.45', transform: 'scale(0.85)' },
          to: { opacity: '0', transform: 'scale(1.7)' },
        },
        // cây lớn lên khi một từ lên cấp
        grow: {
          '0%': { transform: 'scale(0.6) translateY(4px)', opacity: '0.4' },
          '70%': { transform: 'scale(1.1) translateY(0)', opacity: '1' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
        },
        // vệt sáng chạy qua — khung xương lúc tải, thanh tiến độ
        shimmer: {
          from: { transform: 'translate3d(-100%, 0, 0)' },
          to: { transform: 'translate3d(200%, 0, 0)' },
        },
        // ăn mừng khi hoàn thành
        'trophy-in': {
          '0%': { transform: 'scale(0.3) rotate(-12deg)', opacity: '0' },
          '55%': { transform: 'scale(1.15) rotate(4deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '50%': { transform: 'translate3d(0, -5px, 0)' },
        },
      },

      animation: {
        'fade-in': 'fade-in 0.25s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-slide-up': 'fade-slide-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-slide-down': 'fade-slide-down 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-slide-left': 'fade-slide-left 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
        'pop-in': 'pop-in 0.32s cubic-bezier(0.34, 1.4, 0.64, 1) both',
        pop: 'pop 0.42s cubic-bezier(0.34, 1.4, 0.64, 1) both',
        'pulse-once': 'pulse-once 0.35s ease-out',
        shake: 'shake 0.45s cubic-bezier(0.36, 0.07, 0.19, 0.97) both',
        ripple: 'ripple 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        grow: 'grow 0.5s cubic-bezier(0.34, 1.4, 0.64, 1) both',
        shimmer: 'shimmer 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        'trophy-in': 'trophy-in 0.6s cubic-bezier(0.34, 1.4, 0.64, 1) both',
        float: 'float 3.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
