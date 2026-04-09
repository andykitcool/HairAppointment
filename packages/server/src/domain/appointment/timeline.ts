export interface ServiceStageTemplate {
  name: string
  duration: number
  staff_busy: boolean
}

export interface AppointmentTimelineStage {
  stage_name: string
  duration: number
  start: string
  end: string
  staff_busy: boolean
}

export interface RecalculateTimelineResult {
  timeline: AppointmentTimelineStage[]
  endTime: string
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function recalculateTimelineByActualDuration(
  startTime: string,
  stages: ServiceStageTemplate[],
  totalDuration: number,
  actualDuration: number,
  fallbackEndTime: string,
): RecalculateTimelineResult {
  const ratio = totalDuration > 0 ? actualDuration / totalDuration : 1
  const timeline: AppointmentTimelineStage[] = stages.map((stage) => ({
    stage_name: stage.name,
    duration: stage.duration,
    start: startTime,
    end: startTime,
    staff_busy: stage.staff_busy,
  }))

  let currentMinutes = timeToMinutes(startTime)
  for (const stage of timeline) {
    stage.start = minutesToTime(currentMinutes)
    currentMinutes += Math.round(stage.duration * ratio) || stage.duration
    stage.end = minutesToTime(currentMinutes)
  }

  return {
    timeline,
    endTime: timeline[timeline.length - 1]?.end || fallbackEndTime,
  }
}
