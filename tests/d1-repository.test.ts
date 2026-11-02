import { H3Event } from 'h3'
import { describe, expect, it, vi } from 'vitest'
import { createD1Repository } from '../server/repositories/d1'
import { getRepository, withRepository } from '../server/utils/repository'
import type { D1Result, D1Statement, NaviD1Database } from '../server/repositories/types'

function result<T>(results: T[], changes = 0): D1Result<T> {
  return { success: true, results, meta: { changes } }
}

function mockD1() {
  // This is a method-level D1 binding double. SQL is recorded but never executed,
  // so these tests neither open a database nor require SQLite/Miniflare/Wrangler.
  const statements: Array<{ sql: string; bindings: unknown[] }> = []
  const all = vi.fn<() => Promise<D1Result>>().mockResolvedValue(result([]))
  const first = vi.fn<() => Promise<unknown>>().mockResolvedValue(null)
  const batch = vi.fn<(statements: D1Statement[]) => Promise<D1Result[]>>()
  const db: NaviD1Database = {
    prepare(sql) {
      const call = { sql, bindings: [] as unknown[] }
      statements.push(call)
      const statement: D1Statement = {
        bind(...values) {
          call.bindings = values
          return statement
        },
        async all<T>() {
          return (await all()) as D1Result<T>
        },
        async first<T>() {
          return (await first()) as T | null
        },
        async run() {
          throw new Error('Unexpected run invocation')
        },
      }
      return statement
    },
    async batch<T>(prepared: D1Statement[]) {
      return (await batch(prepared)) as D1Result<T>[]
    },
  }
  return { db, statements, all, first, batch }
}

describe('D1-only repository', () => {
  it('returns supplied D1 team and exhibition records, including newly registered team keys', async () => {
    const { db, all, batch } = mockD1()
    const team = {
      id: 42,
      key: 'new-research',
      name: '新しい班',
      description: 'D1に登録された説明',
    }
    const exhibition = {
      id: 91,
      teamId: 42,
      deskKey: 'desk-a',
      title: '登録作品',
      description: '登録された説明',
      creatorComment: 'コメント',
      likes: 7,
    }
    all.mockResolvedValueOnce(result([team])).mockResolvedValueOnce(result([exhibition]))
    const repository = createD1Repository(db)
    expect(await repository.listTeams()).toEqual([team])
    expect(await repository.listExhibitions()).toEqual([exhibition])
    expect(batch).not.toHaveBeenCalled()
  })

  it('keeps empty D1 lists empty', async () => {
    const { db } = mockD1()
    const repository = createD1Repository(db)
    expect(await repository.listTeams()).toEqual([])
    expect(await repository.listExhibitions()).toEqual([])
  })

  it('uses the database timestamp for every accepted check-in without visitor deduplication', async () => {
    const { db, first, statements } = mockD1()
    const checkedInAt = '2026-11-01T00:00:00.000Z'
    first.mockResolvedValue({ checkedInAt })
    const repository = createD1Repository(db)
    expect(await repository.addCheckin()).toBe(checkedInAt)
    expect(await repository.addCheckin()).toBe(checkedInAt)
    expect(first).toHaveBeenCalledTimes(2)
    expect(statements).toHaveLength(2)
    expect(
      statements.every((statement) =>
        statement.sql.includes('INSERT INTO checkins DEFAULT VALUES'),
      ),
    ).toBe(true)
    expect(statements.every((statement) => statement.bindings.length === 0)).toBe(true)
  })

  it('does not acknowledge a check-in when the insert returns no timestamp', async () => {
    const { db } = mockD1()
    await expect(createD1Repository(db).addCheckin()).rejects.toThrow('D1 check-in insert failed')
  })

  it('inserts a like and reads the resulting count in one bound D1 batch', async () => {
    const { db, batch, statements } = mockD1()
    batch.mockResolvedValue([result([], 1), result([{ count: 13 }])])
    expect(await createD1Repository(db).addLike(91)).toBe(13)
    expect(batch).toHaveBeenCalledTimes(1)
    expect(batch.mock.calls[0]![0]).toHaveLength(2)
    expect(statements.map((statement) => statement.bindings)).toEqual([[91], [91]])
  })

  it('reports an absent exhibition without returning a count as success', async () => {
    const { db, batch } = mockD1()
    batch.mockResolvedValue([result([], 0), result([{ count: 0 }])])
    expect(await createD1Repository(db).addLike(999)).toBeNull()
  })

  it('rejects an unsuccessful batch rather than returning fabricated counts', async () => {
    const { db, batch } = mockD1()
    batch.mockResolvedValue([{ success: false, results: [], meta: {} }, result([{ count: 0 }])])
    await expect(createD1Repository(db).addLike(91)).rejects.toThrow('D1 query failed')
  })

  it('uses one D1 clock and the inclusive 20-minute window across a JST date boundary', async () => {
    const { db, first, batch, statements } = mockD1()
    const now = '2026-11-01T15:05:00.000Z'
    first.mockResolvedValue({ now })
    const daily = [
      { date: '2026-11-01', count: 5 },
      { date: '2026-11-02', count: 2 },
    ]
    const hourly = [
      { hour: '2026-11-01T23:00:00+09:00', count: 5 },
      { hour: '2026-11-02T00:00:00+09:00', count: 2 },
    ]
    batch.mockResolvedValue([
      result([{ estimatedVisitors: 3, lastCheckinAt: now }]),
      result(daily),
      result(hourly),
    ])
    expect(await createD1Repository(db).getCheckinSnapshot()).toEqual({
      calculatedAt: now,
      lastCheckinAt: now,
      estimatedVisitors: 3,
      daily,
      hourly,
    })
    expect(first).toHaveBeenCalledTimes(1)
    expect(batch).toHaveBeenCalledTimes(1)
    expect(statements[1]!.bindings).toEqual(['2026-11-01T14:45:00.000Z', now])
    expect(statements.slice(2).map((statement) => statement.bindings)).toEqual([[now], [now]])
    expect(statements[1]!.sql).toContain('checked_in_at >= ?')
    expect(
      statements.slice(1).every((statement) => statement.sql.includes('checked_in_at <= ?')),
    ).toBe(true)
    expect(statements[2]!.sql).toContain("'+9 hours'")
    expect(statements[3]!.sql).toContain('%Y-%m-%dT%H:00:00+09:00')
  })

  it('does not fall back to the application clock if the D1 clock is unavailable', async () => {
    const { db, batch } = mockD1()
    await expect(createD1Repository(db).getCheckinSnapshot()).rejects.toThrow(
      'D1 clock unavailable',
    )
    expect(batch).not.toHaveBeenCalled()
  })
})

describe('required D1 binding and public errors', () => {
  it('returns a clear 503 when the Cloudflare binding is missing', () => {
    const event = new H3Event(new Request('http://localhost:3001/api/teams'))
    expect(() => getRepository(event)).toThrow(expect.objectContaining({ statusCode: 503 }))
  })

  it('converts binding failures into 503 without leaking database details', async () => {
    const { db, all } = mockD1()
    const event = new H3Event(new Request('http://localhost:3001/api/teams'), {
      cloudflare: { env: { DB: db } },
    })
    all.mockRejectedValue(new Error('private SQL detail'))
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      await expect(
        withRepository(event, (repository) => repository.listTeams()),
      ).rejects.toMatchObject({
        statusCode: 503,
        message: 'データを取得・保存できませんでした。時間をおいて再試行してください。',
      })
      expect(event.res.headers.get('Cache-Control')).toBe('no-store')
      expect(log).toHaveBeenCalledTimes(1)
    } finally {
      log.mockRestore()
    }
  })
})
