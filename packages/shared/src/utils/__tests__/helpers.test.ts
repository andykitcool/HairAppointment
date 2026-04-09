import { describe, expect, it } from 'vitest'
import {
  generateTimeSlots,
  generateTimeline,
  getBusyRanges,
  isTimeOverlap,
  minutesToTime,
  timeToMinutes,
} from '../helpers.js'

describe('shared helpers', () => {
  it('converts time string to minutes', () => {
    expect(timeToMinutes('09:30')).toBe(570)
  })

  it('converts minutes to time string', () => {
    expect(minutesToTime(570)).toBe('09:30')
  })

  it('treats touching ranges as non-overlapping', () => {
    expect(isTimeOverlap('09:00', '10:00', '10:00', '11:00')).toBe(false)
  })

  it('detects overlapping ranges', () => {
    expect(isTimeOverlap('09:00', '10:30', '10:00', '11:00')).toBe(true)
  })

  it('builds a timeline from staged service steps', () => {
    const timeline = generateTimeline([
      { name: '洗发', duration: 15, staff_busy: true },
      { name: '等待', duration: 20, staff_busy: false },
      { name: '剪发', duration: 30, staff_busy: true },
    ], '10:00')

    expect(timeline).toEqual([
      { stage_name: '洗发', start: '10:00', end: '10:15', staff_busy: true },
      { stage_name: '等待', start: '10:15', end: '10:35', staff_busy: false },
      { stage_name: '剪发', start: '10:35', end: '11:05', staff_busy: true },
    ])
  })

  it('merges consecutive busy ranges only', () => {
    const ranges = getBusyRanges([
      { start: '10:00', end: '10:15', staff_busy: true },
      { start: '10:15', end: '10:35', staff_busy: true },
      { start: '10:35', end: '10:50', staff_busy: false },
      { start: '10:50', end: '11:20', staff_busy: true },
    ])

    expect(ranges).toEqual([
      { start: '10:00', end: '10:35' },
      { start: '10:50', end: '11:20' },
    ])
  })

  it('generates slots with fixed step', () => {
    expect(generateTimeSlots('09:00', '10:00', 30)).toEqual([
      { start: '09:00', end: '09:30' },
      { start: '09:30', end: '10:00' },
    ])
  })
})