import { createError, getRequestHeader, readRawBody, setResponseHeader, type H3Event } from 'h3'
import { useRuntimeConfig } from '#imports'
import { isSameOriginPost, takeToken, type RateBucket } from '../services/request-policy'

const buckets = new Map<string, RateBucket>()

export async function protectMutation(event: H3Event, kind: 'checkin' | 'like'): Promise<void> {
  const config = useRuntimeConfig(event)
  if (
    !isSameOriginPost(
      getRequestHeader(event, 'origin'),
      getRequestHeader(event, 'sec-fetch-site'),
      config.public.siteUrl,
    )
  ) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      message: '同じサイトから操作してください。',
    })
  }

  // Global short-lived process budgets reduce accidental loops without collecting IPs,
  // cookies or visitor IDs. They do not deduplicate people: every accepted POST still counts.
  // Worker isolates do not share this budget; edge rate limits are an additional deployment control.
  const capacity = kind === 'checkin' ? 120 : 360
  const now = Date.now()
  const bucket = buckets.get(kind) ?? { tokens: capacity, updatedAt: now }
  buckets.set(kind, bucket)
  if (!takeToken(bucket, now, capacity, 60_000)) {
    setResponseHeader(event, 'Retry-After', 1)
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      message: '送信が集中しています。少し待ってから再試行してください。',
    })
  }

  // These endpoints intentionally accept no user fields (including timestamps/identifiers).
  // Native empty forms and bodyless $fetch requests both work; arbitrary payloads do not.
  const declaredLength = Number(getRequestHeader(event, 'content-length') ?? '0')
  if (
    !Number.isFinite(declaredLength) ||
    declaredLength > 0 ||
    getRequestHeader(event, 'transfer-encoding')
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'リクエスト本文は指定できません。',
    })
  }
  const body = await readRawBody(event)
  if (body)
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'リクエスト本文は指定できません。',
    })
}
