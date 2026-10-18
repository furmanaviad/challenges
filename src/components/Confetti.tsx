import { useMemo } from 'react'

const COLORS = ['#ff7a45', '#f5b82e', '#4cc38a', '#3ec1d3', '#6c8cff', '#b27cff', '#ff6b9a']

export function Confetti({ burst, big }: { burst: number; big?: boolean }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: big ? 70 : 32 }, (_, i) => ({
        i,
        x: Math.random() * 100,
        dx: (Math.random() - 0.5) * 160,
        delay: Math.random() * 0.25,
        dur: 1.2 + Math.random() * 1,
        rot: Math.random() * 720 - 360,
        color: COLORS[i % COLORS.length],
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [burst, big],
  )
  if (!burst) return null
  return (
    <div className="confetti" key={burst} aria-hidden>
      {pieces.map((p) => (
        <i
          key={p.i}
          style={{
            left: `${p.x}%`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            ['--dx' as string]: `${p.dx}px`,
            ['--rot' as string]: `${p.rot}deg`,
          }}
        />
      ))}
    </div>
  )
}
