import { defineEventHandler } from 'h3'
import { withRepository } from '../utils/repository'

export default defineEventHandler((event) =>
  withRepository(event, async (repository) => ({
    mode: repository.mode,
    teams: await repository.listTeams(),
  })),
)
