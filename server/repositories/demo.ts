import { demoExhibitions, demoTeams } from '../../shared/data/demo'
import { snapshotFromTimestamps } from '../services/checkins'
import type { NaviRepository } from './types'

export function createDemoRepository(clock: () => Date = () => new Date()): NaviRepository {
  const exhibitions = demoExhibitions.map((exhibition) => ({ ...exhibition }))
  const startedAt = clock().getTime()
  // Fabricated timestamps exist only in this process; real check-ins never enter demo storage.
  const timestamps = [2, 3, 5, 7, 9, 11, 13, 15, 17, 19, 28, 35, 46, 52, 65, 77, 90, 110].map(
    (minutesAgo) => new Date(startedAt - minutesAgo * 60_000).toISOString(),
  )

  return {
    mode: 'demo',
    async listTeams() {
      return demoTeams.map((team) => ({ ...team }))
    },
    async listExhibitions() {
      return exhibitions.map((exhibition) => ({ ...exhibition }))
    },
    async addLike(id) {
      const exhibition = exhibitions.find((item) => item.id === id)
      if (!exhibition) return null
      exhibition.likes += 1
      return exhibition.likes
    },
    async addCheckin() {
      // Requirements §3 explicitly overrides visitor deduplication: every accepted POST adds one.
      const checkedInAt = clock().toISOString()
      timestamps.push(checkedInAt)
      return checkedInAt
    },
    async getCheckinSnapshot() {
      return snapshotFromTimestamps(timestamps, clock().toISOString())
    },
  }
}

// Reused across requests in a Node/Worker process, reset on restart and never persisted.
export const demoRepository = createDemoRepository()
