import type { Challenge, LogEntry } from '../domain/types'
import { allPeriods, periodProgress, periodState } from '../domain/schedule'
import { formatShort } from '../domain/dates'
import { fmt } from '../templates'

export function PeriodGrid({ challenge, logs, today }: { challenge: Challenge; logs: LogEntry[]; today: string }) {
  return (
    <div className="grid">
      {allPeriods(challenge).map((p) => {
        const st = periodState(p, logs, today)
        const prog = periodProgress(p, logs)
        const pct = Math.min(1, prog / p.target)
        return (
          <div key={p.index} className={`cell ${st}`} style={{ ['--c' as string]: challenge.color, ['--p' as string]: pct }} title={`${formatShort(p.start)} – ${formatShort(p.end)}: ${fmt(prog)} / ${fmt(p.target)}`}>
            <b>{st === 'done' ? '✓' : p.index + 1}</b>
            <small>
              {challenge.kind === 'amount' ? `${fmt(prog)}/${fmt(p.target)}` : formatShort(p.start)}
            </small>
          </div>
        )
      })}
    </div>
  )
}
