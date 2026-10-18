import { describe, expect, it } from 'vitest'
import { getPeriod, periodCount, periodIndexFor, periodState, status, endDate } from './schedule'
import { summarize } from './stats'
import type { Challenge, LogEntry } from './types'

const base = { id: 'c', emoji: '💪', color: '#f60', createdAt: 0, title: 't' }
const pullups: Challenge = { ...base, kind: 'amount', target: 100, unit: 'pull-ups', periodDays: 7, startDate: '2026-01-01', durationDays: 30 }
const walk: Challenge = { ...base, kind: 'amount', target: 1, unit: 'km', periodDays: 2, startDate: '2026-01-01', durationDays: 14 }
const guitar: Challenge = { ...base, kind: 'amount', target: 5, unit: 'min', periodDays: 1, startDate: '2026-01-01', durationDays: 10 }
const log = (date: string, amount: number, id = date + amount): LogEntry => ({ id, challengeId: 'c', date, amount, createdAt: 0 })

describe('schedule', () => {
  it('computes periods for the three example challenges', () => {
    expect(periodCount(pullups)).toBe(5)
    expect(periodCount(walk)).toBe(7)
    expect(periodCount(guitar)).toBe(10)
    expect(endDate(pullups)).toBe('2026-01-30')
  })

  it('prorates a shorter last period, rounded up', () => {
    const last = getPeriod(pullups, 4)
    expect(last.days).toBe(2)
    expect(last.target).toBe(29)
    expect(last.end).toBe('2026-01-30')
  })

  it('check challenges always need 1 per period', () => {
    const c: Challenge = { ...guitar, kind: 'check', target: 1 }
    expect(getPeriod(c, 3).target).toBe(1)
  })

  it('maps dates to periods and rejects dates outside', () => {
    expect(periodIndexFor(pullups, '2025-12-31')).toBeNull()
    expect(periodIndexFor(pullups, '2026-01-07')).toBe(0)
    expect(periodIndexFor(pullups, '2026-01-08')).toBe(1)
    expect(periodIndexFor(pullups, '2026-01-31')).toBeNull()
  })

  it('reports status', () => {
    expect(status(pullups, '2025-12-31')).toBe('upcoming')
    expect(status(pullups, '2026-01-15')).toBe('active')
    expect(status(pullups, '2026-01-31')).toBe('finished')
  })
})

describe('period state and summary', () => {
  it('flags done / partial / missed / current / upcoming', () => {
    const logs = [log('2026-01-02', 100), log('2026-01-09', 40)]
    const today = '2026-01-17'
    expect(periodState(getPeriod(pullups, 0), logs, today)).toBe('done')
    expect(periodState(getPeriod(pullups, 1), logs, today)).toBe('partial')
    expect(periodState(getPeriod(pullups, 2), logs, today)).toBe('current')
    expect(periodState(getPeriod(pullups, 3), logs, today)).toBe('upcoming')
    expect(periodState(getPeriod(pullups, 2), [], '2026-01-25')).toBe('missed')
  })

  it('counts a streak through the current period when it is done', () => {
    const logs = [log('2026-01-01', 5), log('2026-01-02', 5), log('2026-01-03', 5)]
    const s = summarize(guitar, logs, '2026-01-03')
    expect(s.streak).toBe(3)
    expect(s.current.done).toBe(true)
  })

  it('keeps the streak alive while today is still open', () => {
    const logs = [log('2026-01-01', 5), log('2026-01-02', 5)]
    const s = summarize(guitar, logs, '2026-01-03')
    expect(s.streak).toBe(2)
    expect(s.current.done).toBe(false)
  })

  it('breaks the streak after a missed period', () => {
    const logs = [log('2026-01-01', 5), log('2026-01-03', 5)]
    expect(summarize(guitar, logs, '2026-01-03').streak).toBe(1)
  })

  it('sums several logs in one period and caps overall at the target', () => {
    const logs = [log('2026-01-01', 60, 'a'), log('2026-01-03', 80, 'b')]
    const s = summarize(pullups, logs, '2026-01-04')
    expect(s.current.progress).toBe(140)
    expect(s.current.done).toBe(true)
    expect(s.overall).toBeCloseTo(100 / 429, 5)
  })

  it('handles upcoming and finished challenges', () => {
    expect(summarize(pullups, [], '2025-12-20').current.index).toBe(0)
    const f = summarize(pullups, [], '2026-03-01')
    expect(f.status).toBe('finished')
    expect(f.current.index).toBe(4)
    expect(f.complete).toBe(false)
  })

  it('completes when every period is done, ignoring logs after the end', () => {
    const logs = Array.from({ length: 10 }, (_, i) => log(`2026-01-${String(i + 1).padStart(2, '0')}`, 5))
    expect(summarize(guitar, logs, '2026-01-10').complete).toBe(true)
  })
})
