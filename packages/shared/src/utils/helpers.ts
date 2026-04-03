/**
 * 将时间字符串（HH:mm）转换为当天的分钟数
 */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/**
 * 将分钟数转换为时间字符串（HH:mm）
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * 判断两个时间段是否重叠（开区间 [start1, end1) 与 [start2, end2)）
 * @param start1 第一个时间段开始（HH:mm）
 * @param end1 第一个时间段结束（HH:mm）
 * @param start2 第二个时间段开始（HH:mm）
 * @param end2 第二个时间段结束（HH:mm）
 */
export function isTimeOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  return timeToMinutes(start1) < timeToMinutes(end2) && timeToMinutes(start2) < timeToMinutes(end1)
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * 格式化日期为 YYYYMMDD
 */
export function formatDateCompact(date: string): string {
  return date.replace(/-/g, '')
}

/**
 * 生成预约编号 YYYYMMDD-NNN
 */
export function generateAppointmentId(date: string, sequenceNum: number): string {
  return `${formatDateCompact(date)}-${String(sequenceNum).padStart(3, '0')}`
}

/**
 * 根据服务的 stages 和开始时间生成 timeline
 */
export function generateTimeline(stages: Array<{ name: string; duration: number; staff_busy: boolean }>, startTime: string): Array<{
  stage_name: string
  start: string
  end: string
  staff_busy: boolean
}> {
  let currentMinutes = timeToMinutes(startTime)
  return stages.map((stage) => {
    const start = minutesToTime(currentMinutes)
    currentMinutes += stage.duration
    const end = minutesToTime(currentMinutes)
    return {
      stage_name: stage.name,
      start,
      end,
      staff_busy: stage.staff_busy,
    }
  })
}

/**
 * 获取预约的忙碌时间段（合并连续的 staff_busy=true 阶段）
 */
export function getBusyRanges(timeline: Array<{ start: string; end: string; staff_busy: boolean }>): Array<{ start: string; end: string }> {
  const ranges: Array<{ start: string; end: string }> = []
  let current: { start: string; end: string } | null = null

  for (const stage of timeline) {
    if (stage.staff_busy) {
      if (!current) {
        current = { start: stage.start, end: stage.end }
      } else {
        current.end = stage.end
      }
    } else {
      if (current) {
        ranges.push(current)
        current = null
      }
    }
  }
  if (current) {
    ranges.push(current)
  }
  return ranges
}

/**
 * 分转元，保留两位小数
 */
export function fenToYuan(fen: number): string {
  return (fen / 100).toFixed(2)
}

/**
 * 元转分（四舍五入）
 */
export function yuanToFen(yuan: number): number {
  return Math.round(yuan * 100)
}

/**
 * 生成短随机 ID（用于 service_id, staff_id, merchant_id 等）
 */
export function generateShortId(prefix: string = ''): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let id = ''
  for (let i = 0; i < 12; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return prefix ? `${prefix}_${id}` : id
}

/**
 * 按固定步长生成时间段 slots
 */
export function generateTimeSlots(start: string, end: string, stepMinutes: number = 15): Array<{ start: string; end: string }> {
  const slots: Array<{ start: string; end: string }> = []
  let current = timeToMinutes(start)
  const endTime = timeToMinutes(end)
  while (current + stepMinutes <= endTime) {
    slots.push({
      start: minutesToTime(current),
      end: minutesToTime(current + stepMinutes),
    })
    current += stepMinutes
  }
  return slots
}
