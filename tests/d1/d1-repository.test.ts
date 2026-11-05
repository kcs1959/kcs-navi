import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { getPlatformProxy, type PlatformProxy } from 'wrangler'
import { createD1Repository } from '../../server/repositories/d1'
import type { NaviD1Database, NaviRepository } from '../../server/repositories/types'

let platform: PlatformProxy<{ DB: NaviD1Database }>
let db: NaviD1Database
let repository: NaviRepository

async function executeFile(relativePath: string) {
  const sql = await readFile(new URL(relativePath, import.meta.url), 'utf8')
  const statements = sql
    .replace(/^--.*$/gm, '')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
  await db.batch(statements.map((statement) => db.prepare(statement)))
}

beforeAll(async () => {
  platform = await getPlatformProxy<{ DB: NaviD1Database }>({
    configPath: fileURLToPath(new URL('../../wrangler.jsonc', import.meta.url)),
    persist: false,
    remoteBindings: false,
    envFiles: [],
  })
  db = platform.env.DB
  await executeFile('../../migrations/0001_create_exhibitions.sql')
  repository = createD1Repository(db)
}, 30_000)
afterAll(async () => {
  await platform?.dispose()
})
beforeEach(async () => {
  await db.batch(
    ['likes', 'checkins', 'exhibitions', 'teams'].map((table) =>
      db.prepare(`DELETE FROM ${table}`),
    ),
  )
  await executeFile('../../seeds/test.sql')
})

describe('D1 likes repository', () => {
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
    await executeFile('../../seeds/test.sql')
    expect((await repository.listExhibitions())[0]?.likes).toBe(1)
  })
})
