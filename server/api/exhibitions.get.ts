import { defineEventHandler } from 'h3'
import { withRepository } from '../utils/repository'

export default defineEventHandler((event) =>
  withRepository(event, async (repository) => ({
    exhibitions: await repository.listExhibitions(),
  })),
)
