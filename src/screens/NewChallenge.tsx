import { useState } from 'react'
import type { Ctx } from '../App'
import type { Kind } from '../domain/types'
import { addChallenge } from '../db/repo'
import { COLORS, EMOJIS, TEMPLATES, type Template, durationLabel, periodLabel } from '../templates'
import { takePending } from './nav'

const PERIODS = [1, 2, 7]
const DURATIONS = [7, 14, 30]

export function NewChallenge({ ctx }: { ctx: Ctx }) {
  const [t] = useState<Template | null>(takePending)
  const [title, setTitle] = useState(t?.title ?? '')
  const [emoji, setEmoji] = useState(t?.emoji ?? EMOJIS[0])
  const [color, setColor] = useState(t?.color ?? COLORS[0])
  const [kind, setKind] = useState<Kind>(t?.kind ?? 'amount')
  const [target, setTarget] = useState(String(t?.target ?? 10))
  const [unit, setUnit] = useState(t?.unit ?? '')
  const [period, setPeriod] = useState(t?.periodDays ?? 1)
  const [customPeriod, setCustomPeriod] = useState(false)
  const [duration, setDuration] = useState(String(t?.durationDays ?? 30))
  const [durUnit, setDurUnit] = useState<'days' | 'weeks'>('days')
  const [reminder, setReminder] = useState('')

  const apply = (x: Template) => {
    setTitle(x.title)
    setEmoji(x.emoji)
    setColor(x.color)
    setKind(x.kind)
    setTarget(String(x.target))
    setUnit(x.unit)
    setPeriod(x.periodDays)
    setCustomPeriod(false)
    setDuration(String(x.durationDays))
    setDurUnit('days')
  }

  const targetN = parseFloat(target)
  const durationDays = Math.round((parseFloat(duration) || 0) * (durUnit === 'weeks' ? 7 : 1))
  const valid = title.trim() && period >= 1 && durationDays >= 1 && durationDays <= 730 && (kind === 'check' || (targetN > 0 && unit.trim()))

  async function save() {
    if (!valid) return
    const id = await addChallenge({
      title: title.trim(),
      emoji,
      color,
      kind,
      target: kind === 'check' ? 1 : targetN,
      unit: kind === 'check' ? '' : unit.trim(),
      periodDays: period,
      startDate: ctx.today,
      durationDays,
      reminderTime: reminder || undefined,
    })
    ctx.go({ name: 'detail', id })
  }

  return (
    <div className="screen">
      <header className="row">
        <button className="link" onClick={() => ctx.go({ name: 'today' })}>
          Cancel
        </button>
        <h1 className="small">New challenge</h1>
        <span style={{ width: 52 }} />
      </header>

      <div className="chips scroll">
        {TEMPLATES.map((x) => (
          <button key={x.label} className="chip" onClick={() => apply(x)}>
            {x.label}
          </button>
        ))}
      </div>

      <div className="field">
        <label>Name</label>
        <div className="name-row">
          <select value={emoji} onChange={(e) => setEmoji(e.target.value)} aria-label="Emoji" className="emoji-pick">
            {EMOJIS.map((e) => (
              <option key={e}>{e}</option>
            ))}
          </select>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Pull-ups" maxLength={40} />
        </div>
      </div>

      <div className="sentence">
        <span>I will</span>
        {kind === 'amount' ? (
          <>
            <input className="inline num" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Amount" />
            <input className="inline" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="unit (km, min…)" aria-label="Unit" />
          </>
        ) : (
          <b className="inline-text">{title || 'do it'}</b>
        )}
        <span>every</span>
        {customPeriod ? (
          <>
            <input className="inline num" inputMode="numeric" value={period} onChange={(e) => setPeriod(Math.max(1, parseInt(e.target.value) || 1))} aria-label="Days per period" />
            <span>days</span>
          </>
        ) : (
          <select
            className="inline"
            value={period}
            onChange={(e) => {
              if (e.target.value === 'custom') setCustomPeriod(true)
              else setPeriod(Number(e.target.value))
            }}
          >
            {PERIODS.map((p) => (
              <option key={p} value={p}>
                {p === 2 ? 'other day' : periodLabel(p)}
              </option>
            ))}
            <option value="custom">custom…</option>
          </select>
        )}
        <span>for</span>
        <input className="inline num" inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value)} aria-label="Duration" />
        <select className="inline" value={durUnit} onChange={(e) => setDurUnit(e.target.value as 'days' | 'weeks')}>
          <option value="days">days</option>
          <option value="weeks">weeks</option>
        </select>
      </div>
      <div className="chips">
        {DURATIONS.map((d) => (
          <button
            key={d}
            className={`chip ${durationDays === d ? 'on' : ''}`}
            onClick={() => {
              setDuration(String(d))
              setDurUnit('days')
            }}
          >
            {durationLabel(d)}
          </button>
        ))}
      </div>

      <div className="field">
        <label>Type</label>
        <div className="seg">
          <button className={kind === 'amount' ? 'on' : ''} onClick={() => setKind('amount')}>
            Count an amount
          </button>
          <button className={kind === 'check' ? 'on' : ''} onClick={() => setKind('check')}>
            Just yes / no
          </button>
        </div>
      </div>

      <div className="field">
        <label>Color</label>
        <div className="swatches">
          {COLORS.map((c) => (
            <button key={c} className={c === color ? 'on' : ''} style={{ background: c }} onClick={() => setColor(c)} aria-label={`Color ${c}`} />
          ))}
        </div>
      </div>

      <div className="field">
        <label>Reminder (optional)</label>
        <input type="time" value={reminder} onChange={(e) => setReminder(e.target.value)} />
        {reminder && <p className="hint">After saving, you can add it to your Calendar from the challenge page.</p>}
      </div>

      <button className="primary" style={{ background: color }} disabled={!valid} onClick={save}>
        Start challenge
      </button>
    </div>
  )
}
