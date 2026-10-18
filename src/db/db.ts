import Dexie, { type EntityTable } from 'dexie'
import type { Challenge, LogEntry } from '../domain/types'

export const db = new Dexie('challenges') as Dexie & {
  challenges: EntityTable<Challenge, 'id'>
  logs: EntityTable<LogEntry, 'id'>
}

db.version(1).stores({
  challenges: 'id, createdAt, archivedAt',
  logs: 'id, challengeId, date',
})
