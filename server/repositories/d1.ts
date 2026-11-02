import type { CheckinSnapshot, DailyCount, Exhibition, HourlyCount, Team } from '../../shared/types'
import { WINDOW_MINUTES } from '../services/checkins'
import type { D1Result, NaviD1Database, NaviRepository } from './types'

function rows<T>(result: D1Result<T>): T[] {
  if (!result.success) throw new Error('D1 query failed')
  return result.results
}

export function createD1Repository(db: NaviD1Database): NaviRepository {
  return {
    mode: 'd1',
    async listTeams() {
      return rows(
        await db.prepare('SELECT id, key, name, description FROM teams ORDER BY id').all<Team>(),
      )
    },
    async listExhibitions() {
      return rows(
        await db
          .prepare(
            `
        SELECT e.id, e.team_id AS teamId, e.desk_key AS deskKey, e.title,
               e.description, e.creator_comment AS creatorComment,
               (SELECT COUNT(*) FROM likes l WHERE l.exhibition_id = e.id) AS likes
        FROM exhibitions e ORDER BY e.id
      `,
          )
          .all<Exhibition>(),
      )
    },
    async addLike(exhibitionId) {
      // D1 batch executes transactionally: never return success for an absent exhibition,
      // and read the count only after this request's insert without a read/modify/write race.
      const results = await db.batch([
        db
          .prepare('INSERT INTO likes (exhibition_id) SELECT id FROM exhibitions WHERE id = ?')
          .bind(exhibitionId),
        db
          .prepare('SELECT COUNT(*) AS count FROM likes WHERE exhibition_id = ?')
          .bind(exhibitionId),
      ])
      for (const result of results) rows(result)
      if (!results[0]?.meta.changes) return null
      return (results[1]?.results[0] as { count: number }).count
    },
    async addCheckin() {
      // The database owns the timestamp. No visitor identity or client-supplied time is stored.
      const result = await db
        .prepare('INSERT INTO checkins DEFAULT VALUES RETURNING checked_in_at AS checkedInAt')
        .first<{ checkedInAt: string }>()
      if (!result) throw new Error('D1 check-in insert failed')
      return result.checkedInAt
    },
    async getCheckinSnapshot(): Promise<CheckinSnapshot> {
      const clock = await db
        .prepare("SELECT strftime('%Y-%m-%dT%H:%M:%fZ', 'now') AS now")
        .first<{ now: string }>()
      if (!clock) throw new Error('D1 clock unavailable')
      const calculatedAt = clock.now
      const windowStart = new Date(Date.parse(calculatedAt) - WINDOW_MINUTES * 60_000).toISOString()

      // All aggregates share one D1 clock and transaction. ISO UTC storage preserves indexed
      // comparisons. Include both 20-minute endpoints, but exclude future records everywhere.
      // JST midnight/hour boundaries apply even outside event hours: accepted entries count.
      const results = await db.batch([
        db
          .prepare(
            `
          SELECT COUNT(CASE WHEN checked_in_at >= ? THEN 1 END) AS estimatedVisitors,
                 MAX(checked_in_at) AS lastCheckinAt
          FROM checkins WHERE checked_in_at <= ?
        `,
          )
          .bind(windowStart, calculatedAt),
        db
          .prepare(
            `
          SELECT strftime('%Y-%m-%d', checked_in_at, '+9 hours') AS date, COUNT(*) AS count
          FROM checkins WHERE checked_in_at <= ? GROUP BY date ORDER BY date
        `,
          )
          .bind(calculatedAt),
        db
          .prepare(
            `
          SELECT strftime('%Y-%m-%dT%H:00:00+09:00', checked_in_at, '+9 hours') AS hour, COUNT(*) AS count
          FROM checkins WHERE checked_in_at <= ? GROUP BY hour ORDER BY hour
        `,
          )
          .bind(calculatedAt),
      ])
      const totals = rows(results[0]!)[0] as {
        estimatedVisitors: number
        lastCheckinAt: string | null
      }
      return {
        calculatedAt,
        estimatedVisitors: totals.estimatedVisitors,
        lastCheckinAt: totals.lastCheckinAt,
        daily: rows(results[1]!) as DailyCount[],
        hourly: rows(results[2]!) as HourlyCount[],
      }
    },
  }
}
