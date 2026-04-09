export function shouldResetDailyCounter(counterDate: string | undefined, targetDate: string): boolean {
  return counterDate !== targetDate
}

export function buildDailyCounterResetUpdate(targetDate: string) {
  return { $set: { counter_date: targetDate, daily_counter: 0 } }
}

export function resolveDailySequenceNumber(counterValue: number | undefined): number {
  return counterValue || 1
}
