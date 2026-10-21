import { describe, expect, it } from 'vitest'
import { timeLeftLabel } from './templates'

const at = (h: number, m = 0) => new Date(2026, 0, 5, h, m)

describe('timeLeftLabel', () => {
  it('shows hours left for a daily challenge', () => {
    expect(timeLeftLabel(1, 1, at(19, 0))).toBe('5 hours left today')
    expect(timeLeftLabel(1, 1, at(22, 40))).toBe('1 hour left today')
  })
  it('shows under an hour near midnight', () => {
    expect(timeLeftLabel(1, 1, at(23, 30))).toBe('Less than 1 hour left today')
  })
  it('shows hours on the last day of a longer period', () => {
    expect(timeLeftLabel(7, 1, at(18, 0))).toBe('6 hours left in this week')
    expect(timeLeftLabel(2, 1, at(18, 0))).toBe('6 hours left in this round')
  })
  it('shows days while more than one day remains', () => {
    expect(timeLeftLabel(7, 3, at(9))).toBe('3 days left this week')
    expect(timeLeftLabel(3, 2, at(9))).toBe('2 days left in this round')
  })
})
