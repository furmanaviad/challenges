import type { DateStr } from './types'

const DAY = 86_400_000

function toUTC(d: DateStr): number {
  const [y, m, day] = d.split('-').map(Number)
  return Date.UTC(y, m - 1, day)
}

function fromUTC(ms: number): DateStr {
  const d = new Date(ms)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`
}

export function todayStr(now: Date = new Date()): DateStr {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`
}

export function addDays(d: DateStr, n: number): DateStr {
  return fromUTC(toUTC(d) + n * DAY)
}

/** Whole days from a to b (b - a). */
export function diffDays(a: DateStr, b: DateStr): number {
  return Math.round((toUTC(b) - toUTC(a)) / DAY)
}

export function formatShort(d: DateStr): string {
  const [y, m, day] = d.split('-').map(Number)
  return new Date(y, m - 1, day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
