import { diffDays } from './dates'
import { allPeriods, getPeriod, periodIndexFor, periodProgress, periodState, status } from './schedule'
import type { Challenge, DateStr, LogEntry } from './types'

export interface Summary {
  status: ReturnType<typeof status>
  /** Current period (the last one if finished, the first if upcoming). */
  current: { index: number; progress: number; target: number; done: boolean; daysLeft: number }
  periodsDone: number
  periodsTotal: number
  /** 0..1 across the whole challenge, capping each period at its target. */
  overall: number
  streak: number
  totalLogged: number
  /** All periods complete. */
  complete: boolean
}

export function summarize(c: Challenge, logs: LogEntry[], today: DateStr): Summary {
  const st = status(c, today)
  const periods = allPeriods(c)
  const idx = st === 'upcoming' ? 0 : st === 'finished' ? periods.length - 1 : (periodIndexFor(c, today) ?? 0)
  const cur = getPeriod(c, idx)
  const progress = periodProgress(cur, logs)

  const states = periods.map((p) => periodState(p, logs, today))
  const periodsDone = states.filter((s) => s === 'done').length

  let capped = 0
  let targets = 0
  for (const p of periods) {
    capped += Math.min(periodProgress(p, logs), p.target)
    targets += p.target
  }

  // Streak: consecutive done periods ending at the current one (if done) or the one before it.
  let streak = 0
  let i = st === 'upcoming' ? -1 : states[idx] === 'done' ? idx : idx - 1
  while (i >= 0 && states[i] === 'done') {
    streak++
    i--
  }

  return {
    status: st,
    current: {
      index: idx,
      progress,
      target: cur.target,
      done: progress >= cur.target,
      daysLeft: Math.max(0, diffDays(today, cur.end) + 1),
    },
    periodsDone,
    periodsTotal: periods.length,
    overall: targets === 0 ? 0 : capped / targets,
    streak,
    totalLogged: logs.reduce((s, l) => s + l.amount, 0),
    complete: periodsDone === periods.length,
  }
}
