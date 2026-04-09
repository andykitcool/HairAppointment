export interface DateRange {
  start: string
  end: string
}

export interface RevenueAggregateRow {
  total?: number
  count?: number
}

export interface AppointmentAggregateRow {
  _id: string
  count: number
}

export interface DailyRevenueRow {
  _id: string
  revenue: number
}

export interface ServiceRankingRow {
  _id: string
  count: number
  revenue: number
}

export function resolveStatsDateRange(startDate?: string, endDate?: string, now: Date = new Date()): DateRange {
  const today = now.toISOString().slice(0, 10)
  return {
    start: startDate || today,
    end: endDate || today,
  }
}

export function summarizeRevenueAggregate(rows: RevenueAggregateRow[]) {
  return {
    total_revenue: rows[0]?.total || 0,
    total_transactions: rows[0]?.count || 0,
  }
}

export function summarizeAppointmentAggregate(rows: AppointmentAggregateRow[]) {
  return {
    total_appointments: rows.reduce((sum, row) => sum + row.count, 0),
    completed_appointments: rows.find((row) => row._id === 'completed')?.count || 0,
    cancelled_appointments: rows.find((row) => row._id === 'cancelled')?.count || 0,
  }
}

export function mapDailyRevenueRows(rows: DailyRevenueRow[]) {
  return rows.map((row) => ({ date: row._id, revenue: row.revenue }))
}

export function mapServiceRankingRows(rows: ServiceRankingRow[]) {
  return rows.map((row) => ({
    service_name: row._id,
    count: row.count,
    revenue: row.revenue,
  }))
}

export function buildRevenueStatsData(
  revenueRows: RevenueAggregateRow[],
  appointmentRows: AppointmentAggregateRow[],
  dailyRevenueRows: DailyRevenueRow[],
  serviceRankingRows: ServiceRankingRow[],
) {
  return {
    ...summarizeRevenueAggregate(revenueRows),
    ...summarizeAppointmentAggregate(appointmentRows),
    daily_revenue: mapDailyRevenueRows(dailyRevenueRows),
    service_ranking: mapServiceRankingRows(serviceRankingRows),
  }
}
