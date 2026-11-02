import type { CheckinSnapshot, CheckinStatsResponse, Congestion } from '../../shared/types'

export const CAPACITY = 40 as const
export const WINDOW_MINUTES = 20 as const
const JST_OFFSET_MS = 9 * 60 * 60 * 1_000

export function jstDate(timestamp: string): string {
  return new Date(Date.parse(timestamp) + JST_OFFSET_MS).toISOString().slice(0, 10)
}

export function congestionFor(
  estimatedVisitors: number,
): Pick<Congestion, 'estimatedRate' | 'level' | 'label'> {
  // Multiply first so capacity 40 produces exact 2.5-point steps without binary float tails.
  const estimatedRate = (estimatedVisitors * 100) / CAPACITY
  // Requirements §3 chooses 50% and 80% as understandable advisory thresholds.
  // Never cap at 100%: showing an over-capacity estimate is useful to visitors.
  if (estimatedRate < 50) return { estimatedRate, level: 'relaxed', label: 'ゆったり' }
  if (estimatedRate < 80) return { estimatedRate, level: 'moderate', label: 'やや混雑' }
  return { estimatedRate, level: 'busy', label: '混雑' }
}

export function buildStats(snapshot: CheckinSnapshot): CheckinStatsResponse {
  const date = jstDate(snapshot.calculatedAt)
  return {
    today: { date, count: snapshot.daily.find((day) => day.date === date)?.count ?? 0 },
    daily: snapshot.daily,
    hourly: snapshot.hourly,
    congestion: {
      estimatedVisitors: snapshot.estimatedVisitors,
      ...congestionFor(snapshot.estimatedVisitors),
      capacity: CAPACITY,
      windowMinutes: WINDOW_MINUTES,
      calculatedAt: snapshot.calculatedAt,
      lastCheckinAt: snapshot.lastCheckinAt,
    },
  }
}
