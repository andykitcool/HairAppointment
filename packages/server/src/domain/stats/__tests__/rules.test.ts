import { describe, expect, it } from 'vitest'
import {
  buildRevenueStatsData,
  mapDailyRevenueRows,
  mapServiceRankingRows,
  resolveStatsDateRange,
  summarizeAppointmentAggregate,
  summarizeRevenueAggregate,
} from '../rules.js'

describe('stats domain rules', () => {
  it('resolves date range with today fallback', () => {
    const range = resolveStatsDateRange(undefined, undefined, new Date('2026-04-09T12:00:00.000Z'))
    expect(range).toEqual({ start: '2026-04-09', end: '2026-04-09' })

    expect(resolveStatsDateRange('2026-04-01', '2026-04-07', new Date('2026-04-09T12:00:00.000Z'))).toEqual({
      start: '2026-04-01',
      end: '2026-04-07',
    })
  })

  it('summarizes revenue aggregate rows', () => {
    expect(summarizeRevenueAggregate([])).toEqual({ total_revenue: 0, total_transactions: 0 })
    expect(summarizeRevenueAggregate([{ total: 368, count: 5 }])).toEqual({
      total_revenue: 368,
      total_transactions: 5,
    })
  })

  it('summarizes appointment aggregate rows', () => {
    const rows = [
      { _id: 'completed', count: 8 },
      { _id: 'cancelled', count: 2 },
      { _id: 'pending', count: 3 },
    ]

    expect(summarizeAppointmentAggregate(rows)).toEqual({
      total_appointments: 13,
      completed_appointments: 8,
      cancelled_appointments: 2,
    })
  })

  it('maps daily revenue and service ranking rows', () => {
    expect(mapDailyRevenueRows([{ _id: '2026-04-09', revenue: 188 }])).toEqual([
      { date: '2026-04-09', revenue: 188 },
    ])

    expect(mapServiceRankingRows([{ _id: '剪发', count: 6, revenue: 588 }])).toEqual([
      { service_name: '剪发', count: 6, revenue: 588 },
    ])
  })

  it('builds full revenue stats response data', () => {
    const data = buildRevenueStatsData(
      [{ total: 500, count: 4 }],
      [{ _id: 'completed', count: 3 }],
      [{ _id: '2026-04-09', revenue: 500 }],
      [{ _id: '洗剪吹', count: 4, revenue: 500 }],
    )

    expect(data).toEqual({
      total_revenue: 500,
      total_transactions: 4,
      total_appointments: 3,
      completed_appointments: 3,
      cancelled_appointments: 0,
      daily_revenue: [{ date: '2026-04-09', revenue: 500 }],
      service_ranking: [{ service_name: '洗剪吹', count: 4, revenue: 500 }],
    })
  })
})
