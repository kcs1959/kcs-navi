import { defineEventHandler } from 'h3'
import { buildStats } from '../../services/checkins'
import { withRepository } from '../../utils/repository'

export default defineEventHandler((event) =>
  withRepository(event, async (repository) => buildStats(await repository.getCheckinSnapshot())),
)
