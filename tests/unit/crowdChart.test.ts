import { describe, expect, it } from 'vitest'
import { crowdChartBuckets } from '../../app/utils/crowdChart'
import { buildStats } from '../../server/services/checkins'

function stats() {
  return buildStats({
    calculatedAt: '2026-12-31T16:35:00.000Z', // JST 2027/1/1 1:35
    estimatedVisitors: 0,
    lastCheckinAt: null,
    daily: [],
    hourly: [],
  })
}

describe('fixed JST attendance chart periods', () => {
  it('keeps 7 hourly labels across midnight and year boundaries without records', () => {
    const items = crowdChartBuckets(stats(), 'hourly')
    expect(items).toHaveLength(7)
    expect(items[0]).toEqual({ key: '2026-12-31T19:00:00+09:00', count: 0 })
    expect(items[6]).toEqual({ key: '2027-01-01T01:00:00+09:00', count: 0 })
    expect(items.every((item) => item.count === 0)).toBe(true)
  })

  it('keeps 7 daily labels across year boundaries without records', () => {
    const items = crowdChartBuckets(stats(), 'daily')
    expect(items).toHaveLength(7)
    expect(items[0]).toEqual({ key: '2026-12-26', count: 0 })
    expect(items[6]).toEqual({ key: '2027-01-01', count: 0 })
    expect(items.every((item) => item.count === 0)).toBe(true)
  })

  it('places hourly counts in their slots, fills gaps, and excludes older and future slots', () => {
    const data = stats()
    data.hourly = [
      { hour: '2027-01-01T02:00:00+09:00', count: 100 },
      { hour: '2027-01-01T01:00:00+09:00', count: 5 },
      { hour: '2026-12-31T18:00:00+09:00', count: 100 },
      { hour: '2026-12-31T19:00:00+09:00', count: 3 },
    ]
    expect(crowdChartBuckets(data, 'hourly').map((item) => item.count)).toEqual([
      3, 0, 0, 0, 0, 0, 5,
    ])
  })

  it('places daily counts in their slots, fills gaps, and excludes older and future days', () => {
    const data = stats()
    data.daily = [
      { date: '2027-01-02', count: 100 },
      { date: '2027-01-01', count: 5 },
      { date: '2026-12-25', count: 100 },
      { date: '2026-12-26', count: 3 },
    ]
    expect(crowdChartBuckets(data, 'daily').map((item) => item.count)).toEqual([
      3, 0, 0, 0, 0, 0, 5,
    ])
  })
})
