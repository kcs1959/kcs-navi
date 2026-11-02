import { describe, expect, it } from 'vitest'
import { isSameOriginPost, parseExhibitionId, takeToken } from '../server/services/request-policy'

describe('write request origin policy', () => {
  const siteUrl = 'http://localhost:3001'
  it('allows native forms and fetch from the configured origin', () => {
    expect(isSameOriginPost(siteUrl, 'same-origin', siteUrl)).toBe(true)
    expect(isSameOriginPost(undefined, 'same-origin', siteUrl)).toBe(true)
  })
  it('rejects cross-site, cross-port, absent and malformed origins', () => {
    expect(isSameOriginPost('https://attacker.example', 'cross-site', siteUrl)).toBe(false)
    expect(isSameOriginPost('http://localhost:3000', undefined, siteUrl)).toBe(false)
    expect(isSameOriginPost(undefined, undefined, siteUrl)).toBe(false)
    expect(isSameOriginPost('null', undefined, siteUrl)).toBe(false)
    expect(isSameOriginPost('http://sub.localhost:3001', 'same-site', siteUrl)).toBe(false)
  })
})

describe('exhibition ID input', () => {
  it.each(['0', '-1', '1.2', '1e3', '01', 'abc', '9007199254740992', undefined])(
    'rejects %s',
    (value) => {
      expect(parseExhibitionId(value)).toBeNull()
    },
  )
  it('accepts positive safe integer IDs', () => {
    expect(parseExhibitionId('12')).toBe(12)
  })
})

describe('anonymous process rate limit', () => {
  it('rejects a burst beyond its budget and replenishes without a visitor identifier', () => {
    const bucket = { tokens: 2, updatedAt: 0 }
    expect(takeToken(bucket, 0, 2, 1000)).toBe(true)
    expect(takeToken(bucket, 0, 2, 1000)).toBe(true)
    expect(takeToken(bucket, 0, 2, 1000)).toBe(false)
    expect(takeToken(bucket, 499, 2, 1000)).toBe(false)
    expect(takeToken(bucket, 500, 2, 1000)).toBe(true)
    expect(takeToken(bucket, 10_000, 2, 1000)).toBe(true)
    expect(bucket.tokens).toBe(1)
  })
  it('does not refill twice if the clock moves backwards', () => {
    const bucket = { tokens: 0, updatedAt: 1000 }
    expect(takeToken(bucket, 0, 2, 1000)).toBe(false)
    expect(takeToken(bucket, 1000, 2, 1000)).toBe(false)
  })
})
