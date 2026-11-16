import { LIKE_LIMIT, type LikeResponse } from '../../shared/types'

export const likeStorageKey = (id: number) => `kcs-navi:likes:v1:${id}`

export function useLocalLikes() {
  const counts = useState<Record<number, number>>('local-like-counts', () => ({}))
  const totals = useState<Record<number, number>>('local-like-totals', () => ({}))
  const pending = useState<Record<number, boolean>>('local-like-pending', () => ({}))
  const storageAvailable = useState('local-like-storage', () => true)

  function syncCount(id: number) {
    try {
      const raw = window.localStorage.getItem(likeStorageKey(id))
      const parsed = raw === null ? 0 : Number(raw)
      const saved = Number.isSafeInteger(parsed) && parsed >= 0 ? Math.min(LIKE_LIMIT, parsed) : 0
      // Keep confirmed clicks in memory if a previous write failed or another tab lags.
      counts.value[id] = Math.max(counts.value[id] ?? 0, saved)
    } catch {
      storageAvailable.value = false
    }
  }

  async function sendLike(id: number): Promise<LikeResponse | undefined> {
    syncCount(id)
    if (pending.value[id] || (counts.value[id] ?? 0) >= LIKE_LIMIT) return
    pending.value[id] = true
    try {
      const response = await $fetch<LikeResponse>(`/api/exhibitions/${id}/likes`, {
        method: 'POST',
        timeout: 10_000,
        retry: 0,
      })
      syncCount(id)
      counts.value[id] = Math.min(LIKE_LIMIT, (counts.value[id] ?? 0) + 1)
      totals.value[id] = Math.max(totals.value[id] ?? 0, response.likes)
      try {
        window.localStorage.setItem(likeStorageKey(id), String(counts.value[id]))
      } catch {
        storageAvailable.value = false
      }
      return response
    } finally {
      pending.value[id] = false
    }
  }

  return { counts, totals, pending, storageAvailable, syncCount, sendLike }
}
