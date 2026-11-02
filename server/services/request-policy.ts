export interface RateBucket {
  tokens: number
  updatedAt: number
}

export function takeToken(
  bucket: RateBucket,
  now: number,
  capacity: number,
  periodMs: number,
): boolean {
  const elapsed = Math.max(0, now - bucket.updatedAt)
  bucket.tokens = Math.min(capacity, bucket.tokens + (elapsed * capacity) / periodMs)
  bucket.updatedAt = Math.max(now, bucket.updatedAt)
  if (bucket.tokens < 1) return false
  bucket.tokens -= 1
  return true
}

export function isSameOriginPost(
  origin: string | undefined,
  fetchSite: string | undefined,
  siteUrl: string,
): boolean {
  if (fetchSite === 'cross-site' || fetchSite === 'same-site') return false
  try {
    // Origin is checked against configured siteUrl, never an untrusted Host/forwarded header.
    if (origin) return new URL(origin).origin === new URL(siteUrl).origin
    return fetchSite === 'same-origin'
  } catch {
    return false
  }
}

export function parseExhibitionId(raw: string | undefined): number | null {
  if (!raw || !/^[1-9]\d*$/.test(raw)) return null
  const id = Number(raw)
  return Number.isSafeInteger(id) ? id : null
}
