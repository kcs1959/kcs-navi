import { describe, expect, it } from 'vitest'
import { buildStats, congestionFor, jstDate } from '../server/services/checkins'
import type { CheckinSnapshot } from '../shared/types'

describe('JST check-in statistics', () => {
  it('changes dates at JST midnight, rather than UTC midnight', () => {
    expect(jstDate('2026-10-31T14:59:59.999Z')).toBe('2026-10-31')
    expect(jstDate('2026-10-31T15:00:00.000Z')).toBe('2026-11-01')
  })

  it('selects the JST current day while preserving D1 daily and date-specific hourly counts', () => {
    const snapshot: CheckinSnapshot = {
      calculatedAt: '2026-11-01T15:00:00.000Z',
      lastCheckinAt: '2026-11-01T15:00:00.000Z',
      estimatedVisitors: 3,
      daily: [
        { date: '2026-11-01', count: 21 },
        { date: '2026-11-02', count: 1 },
      ],
      hourly: [
        { hour: '2026-11-01T00:00:00+09:00', count: 2 },
        { hour: '2026-11-01T23:00:00+09:00', count: 19 },
        { hour: '2026-11-02T00:00:00+09:00', count: 1 },
      ],
    }
    const stats = buildStats(snapshot)
    expect(stats.today).toEqual({ date: '2026-11-02', count: 1 })
    expect(stats.daily).toEqual(snapshot.daily)
    expect(stats.hourly).toEqual(snapshot.hourly)
    expect(stats.congestion).toMatchObject({
      estimatedVisitors: 3,
      estimatedRate: 7.5,
      capacity: 40,
      windowMinutes: 20,
      calculatedAt: snapshot.calculatedAt,
      lastCheckinAt: snapshot.lastCheckinAt,
    })
  })

  it('returns zeros and a null last-check-in timestamp for an empty database result', () => {
    const stats = buildStats({
      calculatedAt: '2026-11-01T00:00:00.000Z',
      lastCheckinAt: null,
      estimatedVisitors: 0,
      daily: [],
      hourly: [],
    })
    expect(stats.today).toEqual({ date: '2026-11-01', count: 0 })
    expect(stats.daily).toEqual([])
    expect(stats.hourly).toEqual([])
    expect(stats.congestion.lastCheckinAt).toBeNull()
    expect(stats.congestion.estimatedRate).toBe(0)
  })

  it("does not treat a previous day's entries as today's count", () => {
    const stats = buildStats({
      calculatedAt: '2026-11-01T15:00:00.000Z',
      lastCheckinAt: '2026-11-01T14:59:00.000Z',
      estimatedVisitors: 1,
      daily: [{ date: '2026-11-01', count: 9 }],
      hourly: [{ hour: '2026-11-01T23:00:00+09:00', count: 9 }],
    })
    expect(stats.today).toEqual({ date: '2026-11-02', count: 0 })
    expect(stats.congestion.estimatedVisitors).toBe(1)
  })
})

describe('congestion thresholds', () => {
  it.each([
    [0, 0, 'relaxed', 'ゆったり'],
    [11, 27.5, 'relaxed', 'ゆったり'],
    [19, 47.5, 'relaxed', 'ゆったり'],
    [20, 50, 'moderate', 'やや混雑'],
    [31, 77.5, 'moderate', 'やや混雑'],
    [32, 80, 'busy', '混雑'],
    [40, 100, 'busy', '混雑'],
    [42, 105, 'busy', '混雑'],
  ])('%i people gives %s%% with the expected label', (visitors, rate, level, label) => {
    expect(congestionFor(visitors)).toEqual({ estimatedRate: rate, level, label })
  })
})
