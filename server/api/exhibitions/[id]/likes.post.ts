import { createError, defineEventHandler, getRouterParam, setResponseHeader } from 'h3'
import { parseExhibitionId } from '../../../services/request-policy'
import { protectMutation } from '../../../utils/mutations'
import { withRepository } from '../../../utils/repository'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const id = parseExhibitionId(getRouterParam(event, 'id'))
  if (id === null)
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: '作品IDが正しくありません。',
    })
  await protectMutation(event, 'like')
  return withRepository(event, async (repository) => {
    const likes = await repository.addLike(id)
    if (likes === null)
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        message: '作品が見つかりません。',
      })
    return { exhibitionId: id, likes }
  })
})
