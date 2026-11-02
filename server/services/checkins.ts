import type {
  CheckinSnapshot,
  CheckinStatsResponse,
  Congestion,
  DataMode,
} from '../../shared/types'

export const CAPACITY = 40 as const
export const WINDOW_MINUTES = 20 as const
const JST_OFFSET_MS = 9 * 60 * 60 * 1_000

export function jstDate(timestamp: string): string {
  return new Date(Date.parse(timestamp) + JST_OFFSET_MS).toISOString().slice(0, 10)
}

export function jstHour(timestamp: string): string {
  return `${new Date(Date.parse(timestamp) + JST_OFFSET_MS).toISOString().slice(0, 13)}:00:00+09:00`
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

export function buildStats(snapshot: CheckinSnapshot, mode: DataMode): CheckinStatsResponse {
  const date = jstDate(snapshot.calculatedAt)
  return {
    mode,
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

export function snapshotFromTimestamps(
  timestamps: readonly string[],
  calculatedAt: string,
): CheckinSnapshot {
  const now = Date.parse(calculatedAt)
  const windowStart = now - WINDOW_MINUTES * 60 * 1_000
  const daily = new Map<string, number>()
  const hourly = new Map<string, number>()
  let estimatedVisitors = 0
  let lastCheckinAt: string | null = null

  // A day is JST midnight-inclusive / next-midnight-exclusive; hours include their date.
  // Opening hours are deliberately not filtered: no confirmed festival schedule exists,
  // and a successfully accepted entry must remain visible even outside opening hours.
  for (const timestamp of timestamps) {
    const at = Date.parse(timestamp)
    if (!Number.isFinite(at) || at > now) continue
    daily.set(jstDate(timestamp), (daily.get(jstDate(timestamp)) ?? 0) + 1)
    hourly.set(jstHour(timestamp), (hourly.get(jstHour(timestamp)) ?? 0) + 1)
    // Both 20-minutes-ago and now are included; future records cannot inflate the estimate.
    if (at >= windowStart) estimatedVisitors += 1
    if (lastCheckinAt === null || at > Date.parse(lastCheckinAt)) lastCheckinAt = timestamp
  }

  return {
    calculatedAt,
    estimatedVisitors,
    lastCheckinAt,
    daily: [...daily]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count })),
    hourly: [...hourly]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([hour, count]) => ({ hour, count })),
  }
}
