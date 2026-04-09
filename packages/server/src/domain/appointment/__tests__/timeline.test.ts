import { describe, expect, it } from 'vitest'
import { recalculateTimelineByActualDuration } from '../timeline.js'

describe('appointment timeline rules', () => {
  it('recalculates timeline with proportional durations', () => {
    const result = recalculateTimelineByActualDuration(
      '10:00',
      [
        { name: '洗发', duration: 30, staff_busy: true },
        { name: '剪发', duration: 45, staff_busy: true },
      ],
      75,
      90,
      '11:15',
    )

    expect(result.timeline).toEqual([
      { stage_name: '洗发', duration: 30, start: '10:00', end: '10:36', staff_busy: true },
      { stage_name: '剪发', duration: 45, start: '10:36', end: '11:30', staff_busy: true },
    ])
    expect(result.endTime).toBe('11:30')
  })

  it('keeps original stage duration when rounded value is zero', () => {
    const result = recalculateTimelineByActualDuration(
      '09:00',
      [
        { name: '咨询', duration: 10, staff_busy: false },
      ],
      100,
      1,
      '09:10',
    )

    expect(result.timeline).toEqual([
      { stage_name: '咨询', duration: 10, start: '09:00', end: '09:10', staff_busy: false },
    ])
    expect(result.endTime).toBe('09:10')
  })

  it('falls back to ratio 1 when service total duration is invalid', () => {
    const result = recalculateTimelineByActualDuration(
      '12:00',
      [
        { name: '染发', duration: 40, staff_busy: true },
      ],
      0,
      80,
      '12:40',
    )

    expect(result.timeline).toEqual([
      { stage_name: '染发', duration: 40, start: '12:00', end: '12:40', staff_busy: true },
    ])
    expect(result.endTime).toBe('12:40')
  })

  it('returns fallback end time when no stages provided', () => {
    const result = recalculateTimelineByActualDuration('14:00', [], 60, 60, '15:00')

    expect(result.timeline).toEqual([])
    expect(result.endTime).toBe('15:00')
  })
})
