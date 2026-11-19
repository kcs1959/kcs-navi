import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { getPlatformProxy, type PlatformProxy } from 'wrangler'
import { createD1Repository } from '../../server/repositories/d1'
import type { NaviD1Database, NaviRepository } from '../../server/repositories/types'

let platform: PlatformProxy<{ DB: NaviD1Database }>
let db: NaviD1Database
let repository: NaviRepository
beforeAll(async () => {
  platform = await getPlatformProxy<{ DB: NaviD1Database }>({
    configPath: fileURLToPath(new URL('../../wrangler.jsonc', import.meta.url)),
    persist: false,
    remoteBindings: false,
    envFiles: [],
  })
  db = platform.env.DB
  const migrationFiles = [
    '0001_create_exhibitions.sql',
    '0002_add_creator_to_exhibitions.sql',
    '0003_make_exhibitions_desk_key_nullable.sql',
    '0004_expand_exhibition_desk_keys.sql',
  ]
  for (const file of migrationFiles) {
    const sql = await readFile(new URL(`../../migrations/${file}`, import.meta.url), 'utf8')
    await db.batch(
      sql
        .replace(/^--.*$/gm, '')
        .split(';')
        .map((sql) => sql.trim())
        .filter(Boolean)
        .map((sql) => db.prepare(sql)),
    )
  }
  repository = createD1Repository(db)
}, 30_000)
afterAll(async () => {
  await platform?.dispose()
})
beforeEach(async () => {
  await db.prepare('DELETE FROM checkins').run()
})

async function executeSqlFile(relativePath: string) {
  const sql = await readFile(new URL(relativePath, import.meta.url), 'utf8')
  const statements = sql
    .replace(/^--.*$/gm, '')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
  await db.batch(statements.map((statement) => db.prepare(statement)))
}

function repositoryAt(timestamp: string) {
  return createD1Repository({
    prepare(sql) {
      return sql.startsWith('INSERT INTO checkins DEFAULT VALUES')
        ? db.prepare(sql.replace('DEFAULT VALUES', '(checked_in_at) VALUES (?)')).bind(timestamp)
        : db.prepare(sql)
    },
    batch: (statements) => db.batch(statements),
  })
}

describe('daily check-in receipt', () => {
  it('returns a database timestamp and the first visitor number', async () => {
    const receipt = await repository.addCheckin()
    expect(receipt.visitorNumber).toBe(1)
    expect(receipt.checkedInAt).toBe(new Date(receipt.checkedInAt).toISOString())
    expect((await repository.getCheckinSnapshot()).daily[0]?.count).toBe(1)
  })
  it('gives each concurrent check-in a distinct position and preserves all rows', async () => {
    const receipts = await Promise.all(Array.from({ length: 10 }, () => repository.addCheckin()))
    expect(receipts.map((receipt) => receipt.visitorNumber).sort((a, b) => a - b)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ])
    expect(await db.prepare('SELECT COUNT(*) AS count FROM checkins').first()).toEqual({
      count: 10,
    })
  })
  it('does not include earlier JST days or future records in the number', async () => {
    await db.batch([
      db.prepare("INSERT INTO checkins (checked_in_at) VALUES ('2020-01-01T00:00:00.000Z')"),
      db.prepare("INSERT INTO checkins (checked_in_at) VALUES ('2099-01-01T00:00:00.000Z')"),
    ])
    expect((await repository.addCheckin()).visitorNumber).toBe(1)
  })
  it('does not change a previous receipt when later visitors arrive', async () => {
    const first = await repository.addCheckin()
    await repository.addCheckin()
    expect(first.visitorNumber).toBe(1)
    expect((await repository.getCheckinSnapshot()).daily[0]?.count).toBe(2)
  })
  it('resets at JST midnight and excludes later timestamps within the same day', async () => {
    await db.batch([
      db.prepare("INSERT INTO checkins (checked_in_at) VALUES ('2026-11-04T14:59:59.999Z')"),
      db.prepare("INSERT INTO checkins (checked_in_at) VALUES ('2026-11-04T15:00:00.000Z')"),
      db.prepare("INSERT INTO checkins (checked_in_at) VALUES ('2026-11-05T14:59:59.999Z')"),
    ])
    expect((await repositoryAt('2026-11-05T14:59:59.998Z').addCheckin()).visitorNumber).toBe(2)
    expect((await repositoryAt('2026-11-05T15:00:00.000Z').addCheckin()).visitorNumber).toBe(1)
  })
})

describe('D1 likes repository', () => {
  beforeEach(async () => {
    await db.batch(
      ['likes', 'exhibitions', 'teams'].map((table) => db.prepare(`DELETE FROM ${table}`)),
    )
    await executeSqlFile('../../seeds/test.sql')
  })
  it('starts at zero and increments only the requested work', async () => {
    expect((await repository.listExhibitions())[0]?.likes).toBe(0)
    expect(await repository.addLike(1)).toBe(1)
    expect(await repository.addLike(1)).toBe(2)
    expect(await repository.addLike(2)).toBe(1)
    expect((await repository.listExhibitions()).slice(0, 2).map((work) => work.likes)).toEqual([
      2, 1,
    ])
    expect(await db.prepare('SELECT COUNT(*) AS count FROM likes').first()).toEqual({ count: 3 })
  })
  it('keeps all concurrent increments without a server-side personal cap', async () => {
    const results = await Promise.all(Array.from({ length: 25 }, () => repository.addLike(1)))
    expect(results.sort((a, b) => a! - b!)).toEqual(
      Array.from({ length: 25 }, (_, index) => index + 1),
    )
    expect((await createD1Repository(db).listExhibitions())[0]?.likes).toBe(25)
  })
  it('does not change totals for a missing work', async () => {
    expect(await repository.addLike(999)).toBeNull()
    expect((await repository.listExhibitions()).every((work) => work.likes === 0)).toBe(true)
  })
  it('preserves totals when exhibition metadata is reseeded', async () => {
    await repository.addLike(1)
    await executeSqlFile('../../seeds/test.sql')
    expect((await repository.listExhibitions())[0]?.likes).toBe(1)
  })
  it('preserves works and likes while expanding to all nine map locations', async () => {
    // persist:false のテストDBを、いいねが空のうちに移行前の3キー制約へ戻す。
    await executeSqlFile('../../migrations/0003_make_exhibitions_desk_key_nullable.sql')
    await expect(
      db.prepare("UPDATE exhibitions SET desk_key = 'desk-d' WHERE id = 1").run(),
    ).rejects.toThrow()
    await db
      .prepare("UPDATE exhibitions SET creator = 'Original creator', desk_key = NULL WHERE id = 2")
      .run()
    await db.batch([
      db
        .prepare('INSERT INTO likes (id, exhibition_id, created_at) VALUES (?, ?, ?)')
        .bind(41, 1, '2026-11-19T12:34:56.789Z'),
      db
        .prepare('INSERT INTO likes (id, exhibition_id, created_at) VALUES (?, ?, ?)')
        .bind(42, 2, '2026-11-19T12:35:00.000Z'),
    ])
    const originalWorks = await repository.listExhibitions()
    const originalLikes = await db.prepare('SELECT * FROM likes ORDER BY id').all()

    // このテスト直前の作品は従来のa〜c/NULLのみ。既存行のあるDBを移行する。
    await executeSqlFile('../../migrations/0004_expand_exhibition_desk_keys.sql')
    expect(await repository.listExhibitions()).toEqual(originalWorks)
    expect((await db.prepare('SELECT * FROM likes ORDER BY id').all()).results).toEqual(
      originalLikes.results,
    )

    for (const [index, key] of [
      'desk-d',
      'desk-e',
      'desk-f',
      'desk-g',
      'desk-h',
      'desk-i',
    ].entries()) {
      await db
        .prepare(
          'INSERT INTO exhibitions (id, team_id, desk_key, title, description, creator_comment) VALUES (?, 1, ?, ?, ?, ?)',
        )
        .bind(100 + index, key, `Work ${key}`, 'Description', '')
        .run()
    }
    expect((await repository.listExhibitions()).slice(4).map((work) => work.deskKey)).toEqual([
      'desk-d',
      'desk-e',
      'desk-f',
      'desk-g',
      'desk-h',
      'desk-i',
    ])
    expect(await repository.addLike(1)).toBe(2)
    const newWork = await repository.listExhibitions()
    expect(newWork.find((work) => work.id === 2)?.creator).toBe('Original creator')
    expect(newWork.find((work) => work.id === 2)?.deskKey).toBeNull()
    expect((await db.prepare('PRAGMA foreign_key_check').all()).results).toEqual([])

    // 改名後も外部キーは新しいexhibitionsを参照し、作品削除時のCASCADEを維持する。
    await db.prepare('DELETE FROM exhibitions WHERE id = 1').run()
    expect((await db.prepare('SELECT * FROM likes WHERE exhibition_id = 1').all()).results).toEqual(
      [],
    )
    expect(
      await db.prepare('SELECT COUNT(*) AS count FROM likes WHERE exhibition_id = 2').first(),
    ).toEqual({ count: 1 })
    await expect(
      db
        .prepare(
          'INSERT INTO exhibitions (id, team_id, desk_key, title, description, creator_comment) VALUES (999, 1, ?, ?, ?, ?)',
        )
        .bind('desk-j', 'Invalid location', 'Description', '')
        .run(),
    ).rejects.toThrow()
  })
})
