import { addDays } from '../domain/dates'
import { endDate } from '../domain/schedule'
import type { Challenge } from '../domain/types'

const stamp = (d: string, hhmm: string) => `${d.replace(/-/g, '')}T${hhmm.replace(':', '')}00`
const esc = (s: string) => s.replace(/[\;,]/g, (m) => '\\' + m).replace(/\n/g, '\\n')

function describe(c: Challenge): string {
  return c.kind === 'check' ? c.title : `${c.target} ${c.unit}`
}

/** Recurring calendar event with an at-time alarm covering the challenge's whole run. */
export function buildIcs(c: Challenge): string {
  const time = c.reminderTime ?? '09:00'
  const until = `${addDays(endDate(c), 1).replace(/-/g, '')}T000000`
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Challenges//EN',
    'BEGIN:VEVENT',
    `UID:${c.id}@challenges.app`,
    `DTSTAMP:${stamp(c.startDate, '00:00')}Z`,
    `DTSTART:${stamp(c.startDate, time)}`,
    `DTEND:${stamp(c.startDate, time)}`,
    `RRULE:FREQ=DAILY;INTERVAL=${c.periodDays};UNTIL=${until}Z`,
    `SUMMARY:${esc(`${c.emoji} ${c.title}`)}`,
    `DESCRIPTION:${esc(`Today: ${describe(c)}`)}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(c.title)}`,
    'TRIGGER:PT0S',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

export function downloadIcs(c: Challenge) {
  const blob = new Blob([buildIcs(c)], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${c.title.replace(/\W+/g, '-').toLowerCase() || 'challenge'}.ics`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
