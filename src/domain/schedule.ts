import { addDays, diffDays } from './dates'
import type { Challenge, DateStr, LogEntry } from './types'

export type ChallengeStatus = 'upcoming' | 'active' | 'finished'
export type PeriodState = 'done' | 'partial' | 'missed' | 'current' | 'upcoming'

export interface Period {
  index: number
  start: DateStr
  end: DateStr
  days: number
  target: number
}

export function endDate(c: Challenge): DateStr {
  return addDays(c.startDate, c.durationDays - 1)
}

export function periodCount(c: Challenge): number {
  return Math.ceil(c.durationDays / c.periodDays)
}

/** A shorter final window gets a prorated target, rounded up. */
export function getPeriod(c: Challenge, index: number): Period {
  const offset = index * c.periodDays
  const days = Math.min(c.periodDays, c.durationDays - offset)
  const target = c.kind === 'check' ? 1 : days === c.periodDays ? c.target : Math.ceil((c.target * days) / c.periodDays)
  return { index, start: addDays(c.startDate, offset), end: addDays(c.startDate, offset + days - 1), days, target }
}

export function allPeriods(c: Challenge): Period[] {
  return Array.from({ length: periodCount(c) }, (_, i) => getPeriod(c, i))
}

export function status(c: Challenge, today: DateStr): ChallengeStatus {
  if (diffDays(today, c.startDate) > 0) return 'upcoming'
  if (diffDays(endDate(c), today) > 0) return 'finished'
  return 'active'
}

/** Index of the period containing `date`, or null when outside the challenge. */
export function periodIndexFor(c: Challenge, date: DateStr): number | null {
  const off = diffDays(c.startDate, date)
  if (off < 0 || off >= c.durationDays) return null
  return Math.floor(off / c.periodDays)
}

export function periodProgress(p: Period, logs: LogEntry[]): number {
  return logs.reduce((s, l) => (l.date >= p.start && l.date <= p.end ? s + l.amount : s), 0)
}

export function periodState(p: Period, logs: LogEntry[], today: DateStr): PeriodState {
  const done = periodProgress(p, logs) >= p.target
  if (done) return 'done'
  if (diffDays(today, p.start) > 0) return 'upcoming'
  if (diffDays(p.end, today) > 0) return progressPartial(p, logs) ? 'partial' : 'missed'
  return 'current'
}

function progressPartial(p: Period, logs: LogEntry[]): boolean {
  return periodProgress(p, logs) > 0
}
