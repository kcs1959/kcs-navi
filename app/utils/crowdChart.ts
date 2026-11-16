import type { CheckinStatsResponse } from '../../shared/types'

// APIの集計時刻を基準にすることで、SSRとブラウザで表示期間を一致させる。
export function crowdChartBuckets(stats: CheckinStatsResponse, period: 'hourly' | 'daily') {
  const hourMs = 60 * 60 * 1000
  const jstOffset = 9 * hourMs
  const step = period === 'hourly' ? hourMs : 24 * hourMs
  const length = period === 'hourly' ? 12 : 7
  const end = Math.floor((Date.parse(stats.congestion.calculatedAt) + jstOffset) / step) * step
  const counts = new Map(
    period === 'hourly'
      ? stats.hourly.map((item) => [item.hour, item.count] as const)
      : stats.daily.map((item) => [item.date, item.count] as const),
  )

  return Array.from({ length }, (_, index) => {
    const date = new Date(end - (length - 1 - index) * step).toISOString()
    const key = period === 'hourly' ? `${date.slice(0, 13)}:00:00+09:00` : date.slice(0, 10)
    return { key, count: counts.get(key) ?? 0 }
  })
}
