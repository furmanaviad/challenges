import type { Ctx } from '../App'
import type { useData } from '../data'
import { summarize } from '../domain/stats'
import { endDate } from '../domain/schedule'
import { formatShort } from '../domain/dates'
import { ProgressRing } from '../components/ProgressRing'

export function Archive({ ctx, data }: { ctx: Ctx; data: ReturnType<typeof useData> }) {
  const rows = data.challenges
    .map((c) => ({ c, s: summarize(c, data.logsBy.get(c.id) ?? [], ctx.today) }))
    .filter(({ c, s }) => c.archivedAt || s.status === 'finished')
    .sort((a, b) => (a.c.startDate < b.c.startDate ? 1 : -1))

  return (
    <div className="screen">
      <header>
        <h1>History</h1>
        <p className="sub">Finished and archived challenges</p>
      </header>
      {rows.length === 0 && <p className="sub">Nothing here yet. Finished challenges will show up with their results.</p>}
      <div className="list">
        {rows.map(({ c, s }) => (
          <button key={c.id} className="card" onClick={() => ctx.go({ name: 'detail', id: c.id })}>
            <ProgressRing value={s.overall} color={c.color} size={64} stroke={7}>
              <span className="emoji sm">{s.complete ? '🏆' : c.emoji}</span>
            </ProgressRing>
            <span className="card-body">
              <b>{c.title}</b>
              <span className="meta">
                {Math.round(s.overall * 100)}% · {s.periodsDone}/{s.periodsTotal} periods
              </span>
              <span className="meta dim">
                {formatShort(c.startDate)} → {formatShort(endDate(c))}
                {c.archivedAt && s.status !== 'finished' ? ' · archived' : ''}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
