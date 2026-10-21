import { useState } from 'react'
import type { Ctx } from '../App'
import type { useData } from '../data'
import { summarize } from '../domain/stats'
import { endDate } from '../domain/schedule'
import { formatShort } from '../domain/dates'
import { archiveChallenge, deleteChallenge, deleteLog, unarchiveChallenge, updateLog } from '../db/repo'
import { downloadIcs } from '../reminders/ics'
import { PeriodGrid } from '../components/PeriodGrid'
import { ProgressRing } from '../components/ProgressRing'
import { durationLabel, fmt, periodLabel } from '../templates'

export function Detail({ ctx, data, id }: { ctx: Ctx; data: ReturnType<typeof useData>; id: string }) {
  const [busy, setBusy] = useState(false)
  const c = data.challenges.find((x) => x.id === id)
  if (!c) {
    return (
      <div className="screen">
        <button className="link" onClick={() => ctx.go({ name: 'today' })}>
          ‹ Back
        </button>
        <p className="sub">This challenge no longer exists.</p>
      </div>
    )
  }
  const logs = data.logsBy.get(id) ?? []
  const s = summarize(c, logs, ctx.today)
  const sorted = [...logs].sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1))
  const check = c.kind === 'check'

  return (
    <div className="screen" style={{ ['--c' as string]: c.color }}>
      <header className="row">
        <button className="link" onClick={() => ctx.go({ name: c.archivedAt ? 'archive' : 'today' })}>
          ‹ Back
        </button>
        <button className="link" onClick={() => ctx.go({ name: 'edit', id: c.id })}>
          Edit
        </button>
      </header>

      <div className="hero">
        <ProgressRing value={s.overall} color={c.color} size={132} stroke={12}>
          <div className="hero-pct">{Math.round(s.overall * 100)}%</div>
        </ProgressRing>
        <h1>
          {c.emoji} {c.title}
        </h1>
        <p className="sub">
          {check ? '' : `${fmt(c.target)} ${c.unit} `}every {periodLabel(c.periodDays)} for {durationLabel(c.durationDays)}
          <br />
          {formatShort(c.startDate)} → {formatShort(endDate(c))}
          {s.status === 'finished' && ' · finished'}
        </p>
      </div>

      <div className="stats">
        <div>
          <b>
            {s.periodsDone}/{s.periodsTotal}
          </b>
          <span>periods done</span>
        </div>
        <div>
          <b>{s.streak > 0 ? `🔥 ${s.streak}` : '0'}</b>
          <span>streak</span>
        </div>
        <div>
          <b>{fmt(s.totalLogged)}</b>
          <span>{check ? 'check-ins' : `total ${c.unit}`}</span>
        </div>
      </div>

      <h3 className="section">Periods</h3>
      <PeriodGrid challenge={c} logs={logs} today={ctx.today} />

      <h3 className="section">History</h3>
      {sorted.length === 0 && <p className="sub">Nothing logged yet.</p>}
      <ul className="history">
        {sorted.map((l) => (
          <li key={l.id}>
            <span>{formatShort(l.date)}</span>
            <b>{check ? '✓' : `${fmt(l.amount)} ${c.unit}`}</b>
            {!check && (
              <button
                className="link"
                onClick={() => {
                  const v = parseFloat(window.prompt('New amount', String(l.amount)) ?? '')
                  if (v > 0) void updateLog(l.id, { amount: v })
                }}
              >
                Edit
              </button>
            )}
            <button className="link danger" onClick={() => void deleteLog(l.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>

      <div className="actions">
        {c.reminderTime && (
          <button className="secondary" onClick={() => downloadIcs(c)}>
            🔔 Add {c.reminderTime} reminder to Calendar
          </button>
        )}
        {c.archivedAt ? (
          <button className="secondary" onClick={() => void unarchiveChallenge(c.id)}>
            Restore to Today
          </button>
        ) : (
          <button
            className="secondary"
            onClick={async () => {
              await archiveChallenge(c.id)
              ctx.go({ name: 'archive' })
            }}
          >
            Archive
          </button>
        )}
        <button
          className="secondary danger"
          disabled={busy}
          onClick={async () => {
            if (!window.confirm(`Delete "${c.title}" and all its logs? This can't be undone.`)) return
            setBusy(true)
            await deleteChallenge(c.id)
            ctx.go({ name: 'today' })
          }}
        >
          Delete challenge
        </button>
      </div>
    </div>
  )
}
