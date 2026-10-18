export type Kind = 'amount' | 'check'

/** 'YYYY-MM-DD' in the user's local calendar. */
export type DateStr = string

export interface Challenge {
  id: string
  title: string
  emoji: string
  color: string
  kind: Kind
  target: number
  unit: string
  periodDays: number
  startDate: DateStr
  durationDays: number
  reminderTime?: string
  createdAt: number
  archivedAt?: number
}

export interface LogEntry {
  id: string
  challengeId: string
  date: DateStr
  amount: number
  createdAt: number
}
