import { useEffect, useRef, useState } from 'react'
import { cn } from '../../../lib/cn'
import {
  LEVEL_INTERVAL,
  LEVEL_NAME,
  MAX_LEVEL,
  type VocabLevel,
} from '../../../lib/vocabSession'

/**
 * The memory-level ring: a seed that grows into a flower, exactly matching the
 * 6 states of the model.
 *
 *   0 Chưa học    hạt chưa gieo (xám, vòng rỗng)
 *   1 Mới học     hạt nứt mầm
 *   2 Nhớ tạm     mầm nhú
 *   3 Nhớ lâu     cây con 2 lá
 *   4 Thuộc lòng  cây lớn 4 lá + nụ
 *   5 Thông thạo  hoa nở (vàng, vòng đầy)
 */
function Plant({ level }: { level: VocabLevel }) {
  const green = level >= 5 ? '#f59e0b' : level === 0 ? '#94a3b8' : '#10b981'
  const soil = level === 0 ? '#cbd5e1' : '#b45309'

  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
      {/* đất */}
      <path
        d="M5 19 Q12 16 19 19 L19 20 Q12 17.5 5 20 Z"
        fill={soil}
        opacity={0.85}
      />

      {/* 0 — hạt chưa gieo */}
      {level === 0 && <ellipse cx="12" cy="17.6" rx="2.6" ry="1.8" fill="#94a3b8" />}

      {/* 1 — hạt nứt mầm */}
      {level === 1 && (
        <>
          <ellipse cx="12" cy="17.6" rx="2.6" ry="1.8" fill="#a16207" />
          <path d="M12 16.4 L12 13.8" stroke={green} strokeWidth="1.5" strokeLinecap="round" />
        </>
      )}

      {/* 2 — mầm nhú (1 lá) */}
      {level === 2 && (
        <>
          <path d="M12 18 L12 11.5" stroke={green} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M12 13 Q15.5 12 15 9 Q12.5 9.8 12 13 Z" fill={green} />
        </>
      )}

      {/* 3 — cây con 2 lá */}
      {level === 3 && (
        <>
          <path d="M12 18 L12 9" stroke={green} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M12 12 Q15.8 11 15.2 7.6 Q12.6 8.6 12 12 Z" fill={green} />
          <path d="M12 13.6 Q8.2 12.6 8.8 9.2 Q11.4 10.2 12 13.6 Z" fill={green} opacity={0.85} />
        </>
      )}

      {/* 4 — cây lớn 4 lá + nụ */}
      {level === 4 && (
        <>
          <path d="M12 18 L12 7" stroke={green} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M12 11 Q16.2 10 15.6 6.4 Q12.6 7.4 12 11 Z" fill={green} />
          <path d="M12 12.8 Q7.8 11.8 8.4 8.2 Q11.4 9.2 12 12.8 Z" fill={green} opacity={0.85} />
          <path d="M12 14.6 Q15.4 14 15 11.4 Q12.6 12 12 14.6 Z" fill={green} opacity={0.6} />
          <circle cx="12" cy="6.2" r="1.9" fill={green} opacity={0.5} />
        </>
      )}

      {/* 5 — hoa nở */}
      {level === 5 && (
        <>
          <path d="M12 18 L12 8" stroke="#10b981" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M12 12.6 Q15.8 11.8 15.2 8.6 Q12.6 9.4 12 12.6 Z" fill="#10b981" />
          <path d="M12 14 Q8.2 13.2 8.8 10 Q11.4 10.8 12 14 Z" fill="#10b981" opacity={0.85} />
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse
              key={a}
              cx="12"
              cy="3.4"
              rx="1.5"
              ry="2.5"
              fill="#f59e0b"
              transform={`rotate(${a} 12 6.2)`}
            />
          ))}
          <circle cx="12" cy="6.2" r="1.5" fill="#fde68a" />
        </>
      )}
    </svg>
  )
}

/** Circular level ring (0–5) with the growing-plant icon inside. */
export function LevelRing({
  level,
  size = 44,
  showName = false,
}: {
  level: VocabLevel
  size?: number
  showName?: boolean
}) {
  const r = (size - 6) / 2
  const c = 2 * Math.PI * r
  const pct = level / MAX_LEVEL

  // Khi một từ LÊN CẤP: cây "lớn lên" và một vòng sáng lan ra sau vòng tròn.
  // Chỉ kích hoạt khi cấp TĂNG — không chạy lại lúc mới gắn hay khi re-render.
  const prevLevel = useRef(level)
  const [grew, setGrew] = useState(false)
  useEffect(() => {
    if (level > prevLevel.current) {
      setGrew(true)
      const t = setTimeout(() => setGrew(false), 700)
      prevLevel.current = level
      return () => clearTimeout(t)
    }
    prevLevel.current = level
  }, [level])

  return (
    <div className="flex items-center gap-2">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        {grew && (
          <span
            className={cn(
              'ripple-ring border-2',
              level >= 5 ? 'border-amber-400' : 'border-emerald-400',
            )}
          />
        )}
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={3}
            className="stroke-slate-200"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
            className={cn(
              'transition-[stroke-dashoffset] duration-500 ease-out',
              level >= 5 ? 'stroke-amber-500' : 'stroke-emerald-500',
            )}
          />
        </svg>
        <span
          className={cn(
            'absolute inset-0 grid place-items-center',
            grew && 'animate-grow',
          )}
        >
          <Plant level={level} />
        </span>
      </div>
      {showName && (
        <span
          className={cn(
            'text-xs font-semibold',
            level >= 5 ? 'text-amber-600' : level === 0 ? 'text-slate-400' : 'text-emerald-700',
          )}
        >
          {LEVEL_NAME[level]}
        </span>
      )}
    </div>
  )
}

/**
 * Tiến độ ghi nhớ của MỘT TỪ trong bài học: mỗi chấm = một DẠNG câu hỏi đã trả
 * lời đúng. Đủ `need` dạng thì từ mới “qua” (hạt nứt mầm → Mới học).
 */
export function CheckDots({ done, need }: { done: number; need: number }) {
  return (
    <span
      className="flex items-center gap-[3px]"
      title={`Đã qua ${Math.min(done, need)}/${need} dạng câu hỏi`}
    >
      {Array.from({ length: need }, (_, i) => (
        <span
          key={i}
          className={cn(
            'h-1.5 w-1.5 rounded-full transition-colors',
            i < done ? 'bg-emerald-500 animate-pop' : 'bg-slate-200',
          )}
        />
      ))}
    </span>
  )
}

/**
 * Chú giải 6 cấp (hạt → hoa) + cách lên cấp:
 * đủ 6 dạng kiểm tra đúng → Mới học; các cấp sau lên dần qua các phiên ôn tập.
 */
export function LevelLegend() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-card">
      <div className="flex flex-wrap items-center justify-center gap-3">
        {([0, 1, 2, 3, 4, 5] as VocabLevel[]).map((l) => (
          <div key={l} className="flex flex-col items-center gap-1">
            <LevelRing level={l} size={34} />
            <span
              className={cn(
                'text-[10px] font-semibold',
                l >= 5
                  ? 'text-amber-600'
                  : l === 0
                    ? 'text-slate-400'
                    : 'text-emerald-700',
              )}
            >
              {LEVEL_NAME[l]}
            </span>
            <span className="text-[9px] text-slate-400">
              {l === 0 ? '6 dạng đúng' : LEVEL_INTERVAL[l]}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-[11px] text-slate-400">
        Trả lời đúng <b>6 dạng câu hỏi khác nhau</b> để một từ lên “Mới học”. Các cấp
        sau lên dần ở mục <b>Ôn từ vựng</b> theo lịch ngắt quãng.
      </p>
    </div>
  )
}
