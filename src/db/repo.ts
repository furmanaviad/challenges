import { db } from './db'
import type { Challenge, DateStr, LogEntry } from '../domain/types'

const uid = () => crypto.randomUUID()

export type NewChallenge = Omit<Challenge, 'id' | 'createdAt' | 'archivedAt'>

export async function addChallenge(input: NewChallenge): Promise<string> {
  const id = uid()
  await db.challenges.add({ ...input, id, createdAt: Date.now() })
  return id
}

export const updateChallenge = (id: string, patch: Partial<Challenge>) => db.challenges.update(id, patch)

export const archiveChallenge = (id: string) => db.challenges.update(id, { archivedAt: Date.now() })
export const unarchiveChallenge = (id: string) => db.challenges.update(id, { archivedAt: undefined })

export async function deleteChallenge(id: string) {
  await db.transaction('rw', db.challenges, db.logs, async () => {
    await db.logs.where('challengeId').equals(id).delete()
    await db.challenges.delete(id)
  })
}

export async function addLog(challengeId: string, date: DateStr, amount: number): Promise<string> {
  const id = uid()
  await db.logs.add({ id, challengeId, date, amount, createdAt: Date.now() })
  return id
}

export const updateLog = (id: string, patch: Partial<LogEntry>) => db.logs.update(id, patch)
export const deleteLog = (id: string) => db.logs.delete(id)

interface Backup {
  app: 'challenges'
  version: 1
  exportedAt: number
  challenges: Challenge[]
  logs: LogEntry[]
}

export async function exportBackup(): Promise<string> {
  const data: Backup = {
    app: 'challenges',
    version: 1,
    exportedAt: Date.now(),
    challenges: await db.challenges.toArray(),
    logs: await db.logs.toArray(),
  }
  return JSON.stringify(data, null, 2)
}

/** Replaces all data with the backup's contents. Throws on a malformed file. */
export async function importBackup(json: string) {
  const data = JSON.parse(json) as Backup
  if (data?.app !== 'challenges' || !Array.isArray(data.challenges) || !Array.isArray(data.logs)) {
    throw new Error('This is not a Challenges backup file.')
  }
  await db.transaction('rw', db.challenges, db.logs, async () => {
    await db.challenges.clear()
    await db.logs.clear()
    await db.challenges.bulkAdd(data.challenges)
    await db.logs.bulkAdd(data.logs)
  })
}

export async function clearAll() {
  await db.transaction('rw', db.challenges, db.logs, async () => {
    await db.challenges.clear()
    await db.logs.clear()
  })
}
