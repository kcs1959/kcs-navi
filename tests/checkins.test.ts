import { describe, expect, it } from 'vitest'
import {
  buildStats,
  congestionFor,
  jstDate,
  jstHour,
  snapshotFromTimestamps,
} from '../server/services/checkins'
import { createDemoRepository } from '../server/repositories/demo'

describe('JST check-in aggregates', () => {
  it('uses JST midnight and date-specific hourly buckets', () => {
    expect(jstDate('2026-10-31T14:59:59.999Z')).toBe('2026-10-31')
    expect(jstDate('2026-10-31T15:00:00.000Z')).toBe('2026-11-01')
    expect(jstHour('2026-10-31T15:35:00.000Z')).toBe('2026-11-01T00:00:00+09:00')
    const snapshot = snapshotFromTimestamps(
      [
        '2026-10-31T14:59:59.999Z',
        '2026-10-31T15:00:00.000Z',
        '2026-10-31T15:59:59.999Z',
        '2026-11-01T15:00:00.000Z',
      ],
      '2026-11-01T16:00:00.000Z',
    )
    expect(snapshot.daily).toEqual([
      { date: '2026-10-31', count: 1 },
      { date: '2026-11-01', count: 2 },
      { date: '2026-11-02', count: 1 },
    ])
    expect(snapshot.hourly).toEqual([
      { hour: '2026-10-31T23:00:00+09:00', count: 1 },
      { hour: '2026-11-01T00:00:00+09:00', count: 2 },
      { hour: '2026-11-02T00:00:00+09:00', count: 1 },
    ])
    expect(buildStats(snapshot, 'demo').today).toEqual({ date: '2026-11-02', count: 1 })
  })

  it('includes both 20-minute boundaries and ignores future/invalid timestamps', () => {
    const snapshot = snapshotFromTimestamps(
      [
        '2026-11-01T00:39:59.999Z',
        '2026-11-01T00:40:00.000Z',
        '2026-11-01T00:50:00.000Z',
        '2026-11-01T01:00:00.000Z',
        '2026-11-01T01:00:00.001Z',
        'invalid',
      ],
      '2026-11-01T01:00:00.000Z',
    )
    expect(snapshot.estimatedVisitors).toBe(3)
    expect(snapshot.daily).toEqual([{ date: '2026-11-01', count: 4 }])
    expect(snapshot.lastCheckinAt).toBe('2026-11-01T01:00:00.000Z')
  })

  it('counts accepted entries outside typical festival hours', () => {
    const snapshot = snapshotFromTimestamps(
      ['2026-10-31T18:00:00.000Z'],
      '2026-10-31T18:01:00.000Z',
    )
    expect(snapshot.hourly).toEqual([{ hour: '2026-11-01T03:00:00+09:00', count: 1 }])
    expect(snapshot.estimatedVisitors).toBe(1)
  })

  it('returns a true zero state without fabricated last update time', () => {
    const stats = buildStats(snapshotFromTimestamps([], '2026-11-01T00:00:00.000Z'), 'd1')
    expect(stats.today).toEqual({ date: '2026-11-01', count: 0 })
    expect(stats.daily).toEqual([])
    expect(stats.hourly).toEqual([])
    expect(stats.congestion.lastCheckinAt).toBeNull()
    expect(stats.congestion.estimatedRate).toBe(0)
    expect(stats.mode).toBe('d1')
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

describe('anonymous demo check-in behavior (no database)', () => {
  it('adds one for every accepted post even at the same timestamp', async () => {
    const repository = createDemoRepository(() => new Date('2026-11-01T01:00:00.000Z'))
    const before = buildStats(await repository.getCheckinSnapshot(), 'demo')
    expect(await repository.addCheckin()).toBe('2026-11-01T01:00:00.000Z')
    await repository.addCheckin()
    const after = buildStats(await repository.getCheckinSnapshot(), 'demo')
    expect(after.today.count).toBe(before.today.count + 2)
    expect(after.congestion.estimatedVisitors).toBe(before.congestion.estimatedVisitors + 2)
  })

  it('only explicit mutations change counts; repeated GETs leave them unchanged', async () => {
    const repository = createDemoRepository(() => new Date('2026-11-01T01:00:00.000Z'))
    const first = await repository.getCheckinSnapshot()
    await repository.listExhibitions()
    await repository.listTeams()
    expect(await repository.getCheckinSnapshot()).toEqual(first)
    expect(await repository.addLike(999)).toBeNull()
    const exhibition = (await repository.listExhibitions())[0]!
    expect(await repository.addLike(exhibition.id)).toBe(exhibition.likes + 1)
    expect(await repository.getCheckinSnapshot()).toEqual(first)
  })
})
