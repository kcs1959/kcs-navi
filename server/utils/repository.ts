import { createError, setResponseHeader, type H3Event } from 'h3'
import { useRuntimeConfig } from '#imports'
import { createD1Repository } from '../repositories/d1'
import { demoRepository } from '../repositories/demo'
import type { NaviD1Database, NaviRepository } from '../repositories/types'

export function getRepository(event: H3Event): NaviRepository {
  const config = useRuntimeConfig(event)
  const cloudflare = event.context.cloudflare as { env?: { DB?: NaviD1Database } } | undefined
  if (config.dataMode === 'demo') {
    // Demo must be an explicit production setting; the Nuxt config leaves production unset.
    // It is visible in every response and never used as a fallback for a failed D1 operation.
    return demoRepository
  }
  if (config.dataMode !== 'd1') {
    throw createError({
      statusCode: 503,
      statusMessage: 'Service Unavailable',
      message: 'データモードの設定を確認してください。',
    })
  }
  if (!cloudflare?.env?.DB) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Service Unavailable',
      message: 'D1が接続されていません。開発環境の設定を確認してください。',
    })
  }
  return createD1Repository(cloudflare.env.DB)
}

export async function withRepository<T>(
  event: H3Event,
  action: (repository: NaviRepository) => Promise<T>,
): Promise<T> {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const repository = getRepository(event)
  try {
    return await action(repository)
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    // Log the cause server-side, while keeping SQL/schema details out of the public response.
    console.error('[KCS Navi] Repository operation failed', error)
    throw createError({
      statusCode: 503,
      statusMessage: 'Service Unavailable',
      message: 'データを取得・保存できませんでした。時間をおいて再試行してください。',
    })
  }
}
