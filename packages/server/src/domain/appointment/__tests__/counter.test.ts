import { describe, expect, it } from 'vitest'
import { buildDailyCounterResetUpdate, resolveDailySequenceNumber, shouldResetDailyCounter } from '../counter.js'

describe('appointment counter rules', () => {
  it('decides whether daily counter reset is needed', () => {
    expect(shouldResetDailyCounter('2026-04-09', '2026-04-09')).toBe(false)
    expect(shouldResetDailyCounter('2026-04-08', '2026-04-09')).toBe(true)
    expect(shouldResetDailyCounter(undefined, '2026-04-09')).toBe(true)
  })

  it('builds reset update payload', () => {
    expect(buildDailyCounterResetUpdate('2026-04-09')).toEqual({
      $set: { counter_date: '2026-04-09', daily_counter: 0 },
    })
  })

  it('resolves next sequence number with fallback', () => {
    expect(resolveDailySequenceNumber(undefined)).toBe(1)
    expect(resolveDailySequenceNumber(1)).toBe(1)
    expect(resolveDailySequenceNumber(27)).toBe(27)
  })
})
