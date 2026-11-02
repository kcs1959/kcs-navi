import type { CheckinSnapshot, Exhibition, Team } from '../../shared/types'

export interface NaviRepository {
  listTeams(): Promise<Team[]>
  listExhibitions(): Promise<Exhibition[]>
  addLike(exhibitionId: number): Promise<number | null>
  addCheckin(): Promise<string>
  getCheckinSnapshot(): Promise<CheckinSnapshot>
}

// A small structural interface keeps the repository independent of Worker globals in Node tests.
export interface D1Statement {
  bind(...values: unknown[]): D1Statement
  all<T>(): Promise<D1Result<T>>
  first<T>(): Promise<T | null>
  run(): Promise<D1Result>
}

export interface D1Result<T = unknown> {
  success: boolean
  results: T[]
  meta: { changes?: number }
}

export interface NaviD1Database {
  prepare(sql: string): D1Statement
  batch<T = unknown>(statements: D1Statement[]): Promise<D1Result<T>[]>
}
