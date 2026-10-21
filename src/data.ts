import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db/db'
import { todayStr } from './domain/dates'
import type { Challenge, LogEntry } from './domain/types'

/** Today's date string, refreshed when the app returns to the foreground. */
export function useToday(): string {
  const [today, setToday] = useState(todayStr())
  const [, tick] = useState(0)
  useEffect(() => {
    // Also re-render so "hours left" labels stay current.
    const refresh = () => {
      setToday(todayStr())
      tick((n) => n + 1)
    }
    document.addEventListener('visibilitychange', refresh)
    const t = setInterval(refresh, 60_000)
    return () => {
      document.removeEventListener('visibilitychange', refresh)
      clearInterval(t)
    }
  }, [])
  return today
}

export function useData() {
  const challenges = useLiveQuery(() => db.challenges.orderBy('createdAt').toArray(), [])
  const logs = useLiveQuery(() => db.logs.toArray(), [])
  const logsBy = useMemo(() => {
    const m = new Map<string, LogEntry[]>()
    for (const l of logs ?? []) {
      const arr = m.get(l.challengeId)
      if (arr) arr.push(l)
      else m.set(l.challengeId, [l])
    }
    return m
  }, [logs])
  return { ready: challenges !== undefined && logs !== undefined, challenges: challenges ?? ([] as Challenge[]), logsBy }
}
