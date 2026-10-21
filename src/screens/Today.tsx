import { useState } from 'react'
import type { Ctx } from '../App'
import type { useData } from '../data'
import type { Challenge } from '../domain/types'
import { summarize } from '../domain/stats'
import { formatShort } from '../domain/dates'
import { addLog, deleteLog } from '../db/repo'
import { ProgressRing } from '../components/ProgressRing'
import { QuickLog } from '../components/QuickLog'
import { TEMPLATES, fmt, periodLabel } from '../templates'
import { goNew } from './nav'

type Data = ReturnType<typeof useData>

export function Today({ ctx, data }: { ctx: Ctx; data: Data }) {
  const [logging, setLogging] = useState<string | null>(null)
  const items = data.challenges
    .filter((c) => !c.archivedAt)
    .map((c) => ({ c, logs: data.logsBy.get(c.id) ?? [] }))
    .map((x) => ({ ...x, s: summarize(x.c, x.logs, ctx.today) }))

  const active = items.filter((x) => x.s.status === 'active')
  const upcoming = items.filter((x) => x.s.status === 'upcoming')
  const open = active.filter((x) => !x.s.current.done)
  const done = active.filter((x) => x.s.current.done)
  const doneCount = done.length

  async function log(c: Challenge, amount: number) {
    const x = items.find((i) => i.c.id === c.id)!
    const before = x.s
    const id = await addLog(c.id, ctx.today, amount)
    const after = summarize(c, [...x.logs, { id, challengeId: c.id, date: ctx.today, amount, createdAt: 0 }], ctx.today)
    setLogging(null)
    const undo = () => void deleteLog(id)
    if (after.complete && after.status === 'active' && after.current.index === after.periodsTotal - 1 && after.current.done) {
      ctx.celebrate(true)
      ctx.toast({ text: `🏆 ${c.title} challenge complete!`, undo })
    } else if (!before.current.done && after.current.done) {
      ctx.celebrate()
      ctx.toast({ text: `🎉 ${c.title}: ${periodLabel(c.periodDays)} target hit!`, undo })
    } else {
      ctx.toast({ text: `Logged ${fmt(amount)} ${c.unit}`.trim(), undo })
    }
  }

  const card = ({ c, s }: (typeof items)[number]) => {
    const pct = s.current.target ? s.current.progress / s.current.target : 0
    const check = c.kind === 'check'
    const onCard = () => {
      if (check) {
        if (!s.current.done) void log(c, 1)
        else ctx.go({ name: 'detail', id: c.id })
      } else setLogging(c.id)
    }
    return (
      <div
        key={c.id}
        role="button"
        tabIndex={0}
        className={`card ${s.current.done ? 'is-done' : ''}`}
        style={{ ['--c' as string]: c.color }}
        onClick={onCard}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onCard()}
        aria-label={check ? `Mark ${c.title} done` : `Log ${c.title}`}
      >
        <ProgressRing value={pct} color={c.color}>
          {s.current.done ? <span className="tick">✓</span> : <span className="emoji">{c.emoji}</span>}
        </ProgressRing>
        <span className="card-body">
          <b>{c.title}</b>
          <span className="meta">
            {check
              ? s.current.done
                ? 'Done for this ' + periodLabel(c.periodDays)
                : `Once every ${periodLabel(c.periodDays)}`
              : `${fmt(s.current.progress)} / ${fmt(s.current.target)} ${c.unit}`}
          </span>
          <span className="meta dim">
            {s.current.daysLeft} day{s.current.daysLeft === 1 ? '' : 's'} left in this {c.periodDays === 1 ? 'day' : c.periodDays === 7 ? 'week' : 'round'}
            {s.streak > 1 ? ` · 🔥 ${s.streak}` : ''}
          </span>
        </span>
        <button
          className="more"
          aria-label={`${c.title} details`}
          onClick={(e) => {
            e.stopPropagation()
            ctx.go({ name: 'detail', id: c.id })
          }}
        >
          ⋯
        </button>
      </div>
    )
  }

  const logTarget = items.find((i) => i.c.id === logging)

  return (
    <div className="screen">
      <header>
        <h1>Today</h1>
        <p className="sub">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          {active.length > 0 && ` · ${doneCount} of ${active.length} done`}
        </p>
      </header>

      {items.length === 0 && (
        <div className="empty">
          <div className="empty-art">🎯</div>
          <h2>Start your first challenge</h2>
          <p>Pick one to begin — you can tweak everything.</p>
          <div className="template-list">
            {TEMPLATES.slice(0, 3).map((t) => (
              <button key={t.label} onClick={() => goNew(ctx, t)}>
                <b>{t.label}</b>
                <span>
                  {t.kind === 'check' ? '' : `${fmt(t.target)} ${t.unit} `}every {periodLabel(t.periodDays)} for {t.durationDays} days
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="list">{open.map(card)}</div>
      {done.length > 0 && <h3 className="section">Done</h3>}
      <div className="list">{done.map(card)}</div>
      {upcoming.length > 0 && <h3 className="section">Starting soon</h3>}
      <div className="list">
        {upcoming.map(({ c }) => (
          <button key={c.id} className="card is-done" onClick={() => ctx.go({ name: 'detail', id: c.id })}>
            <span className="card-body">
              <b>
                {c.emoji} {c.title}
              </b>
              <span className="meta">Starts {formatShort(c.startDate)}</span>
            </span>
          </button>
        ))}
      </div>

      {logTarget && (
        <QuickLog challenge={logTarget.c} progress={logTarget.s.current.progress} target={logTarget.s.current.target} onClose={() => setLogging(null)} onLog={(n) => void log(logTarget.c, n)} />
      )}
    </div>
  )
}
