import type { Kind } from './domain/types'

export interface Template {
  label: string
  title: string
  emoji: string
  color: string
  kind: Kind
  target: number
  unit: string
  periodDays: number
  durationDays: number
}

export const COLORS = ['#ff7a45', '#f5b82e', '#4cc38a', '#3ec1d3', '#6c8cff', '#b27cff', '#ff6b9a']
export const EMOJIS = ['💪', '🚶', '🎸', '📚', '💧', '🧘', '🏃', '🚴', '✍️', '🎯']

export const TEMPLATES: Template[] = [
  { label: '💪 Pull-ups', title: 'Pull-ups', emoji: '💪', color: COLORS[0], kind: 'amount', target: 100, unit: 'pull-ups', periodDays: 7, durationDays: 30 },
  { label: '🚶 Walk', title: 'Walk', emoji: '🚶', color: COLORS[2], kind: 'amount', target: 1, unit: 'km', periodDays: 2, durationDays: 14 },
  { label: '🎸 Guitar', title: 'Guitar', emoji: '🎸', color: COLORS[5], kind: 'amount', target: 5, unit: 'min', periodDays: 1, durationDays: 10 },
  { label: '📚 Read', title: 'Read', emoji: '📚', color: COLORS[4], kind: 'amount', target: 10, unit: 'pages', periodDays: 1, durationDays: 21 },
  { label: '💧 Water', title: 'Drink water', emoji: '💧', color: COLORS[3], kind: 'check', target: 1, unit: '', periodDays: 1, durationDays: 14 },
]

export function periodLabel(days: number): string {
  if (days === 1) return 'day'
  if (days === 7) return 'week'
  return `${days} days`
}

export function durationLabel(days: number): string {
  if (days % 7 === 0 && days >= 14) return `${days / 7} weeks`
  return `${days} day${days === 1 ? '' : 's'}`
}

/** Quick-add chip values scaled to the target. */
export function chipsFor(target: number): number[] {
  if (target <= 1) return [0.25, 0.5, 1]
  if (target <= 5) return [1, 2, 5]
  if (target <= 20) return [1, 5, 10]
  if (target <= 60) return [5, 10, 25]
  return [10, 25, 50]
}

export function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100)
}

/** "5 hours left today" on the last day of a period, otherwise "3 days left this week". */
export function timeLeftLabel(periodDays: number, daysLeft: number, now: Date = new Date()): string {
  if (daysLeft <= 1) {
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    const mins = Math.max(0, Math.round((midnight.getTime() - now.getTime()) / 60000))
    const when = periodDays === 1 ? 'today' : 'in this ' + (periodDays === 7 ? 'week' : 'round')
    if (mins < 60) return `Less than 1 hour left ${when}`
    const h = Math.round(mins / 60)
    return `${h} hour${h === 1 ? '' : 's'} left ${when}`
  }
  const unit = periodDays === 7 ? 'this week' : 'in this round'
  return `${daysLeft} days left ${unit}`
}
