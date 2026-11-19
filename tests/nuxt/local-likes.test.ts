import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { clearNuxtState, useNuxtApp } from '#app'
import ExhibitionModal from '~/components/ExhibitionModal.vue'
import { likeStorageKey } from '~/composables/useLocalLikes'
import type { Exhibition, LikeResponse } from '../../shared/types'

const fetchLike = vi.hoisted(() => vi.fn())
mockNuxtImport('$fetch', () => fetchLike)
const wrappers: Array<{ unmount(): void }> = []
const stateKeys = [
  'local-like-counts',
  'local-like-totals',
  'local-like-pending',
  'local-like-storage',
  'selected-exhibition',
  'exhibition-siblings',
]
const work = (id = 1): Exhibition => ({
  id,
  teamId: 1,
  deskKey: 'desk-a',
  title: `作品${id}`,
  description: '',
  creator: '',
          creatorComment: '',
  likes: 0,
})
function resetState() {
  useNuxtApp().runWithContext(() => clearNuxtState(stateKeys))
}

beforeEach(() => {
  resetState()
  window.localStorage.clear()
  fetchLike.mockReset()
  vi.spyOn(HTMLDialogElement.prototype, 'showModal').mockImplementation(() => {})
  vi.spyOn(HTMLDialogElement.prototype, 'close').mockImplementation(() => {})
})
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  vi.restoreAllMocks()
  resetState()
})
async function mountWork(id = 1) {
  const wrapper = await mountSuspended(ExhibitionModal, {
    props: { exhibition: work(id), siblings: [work(1), work(2)] },
  })
  wrappers.push(wrapper)
  await flushPromises()
  return wrapper
}
function deferred() {
  let resolve!: (value: LikeResponse) => void
  let reject!: (reason: Error) => void
  const promise = new Promise<LikeResponse>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}

describe('localStorage like allowance', () => {
  it('loads the saved count without an API read and stops at ten', async () => {
    window.localStorage.setItem(likeStorageKey(1), '9')
    const wrapper = await mountWork()
    expect(fetchLike).not.toHaveBeenCalled()
    expect(wrapper.find('.like-feedback').text()).toContain('9 / 10')
    fetchLike.mockResolvedValueOnce({ exhibitionId: 1, likes: 30 })
    await wrapper.find('.like-button').trigger('click')
    await flushPromises()
    expect(window.localStorage.getItem(likeStorageKey(1))).toBe('10')
    expect(wrapper.find('.like-feedback').text()).toContain('10 / 10')
    expect(wrapper.find('.like-button').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.like-total').text()).toContain('30')
    await wrapper.find('.like-button').trigger('click')
    expect(fetchLike).toHaveBeenCalledTimes(1)
    expect(fetchLike).toHaveBeenCalledWith('/api/exhibitions/1/likes', {
      method: 'POST',
      timeout: 10_000,
      retry: 0,
    })
  })
  it('retains the allowance after a fresh page state and keeps works independent', async () => {
    window.localStorage.setItem(likeStorageKey(1), '10')
    const wrapper = await mountWork()
    expect(wrapper.find('.like-button').attributes('disabled')).toBeDefined()
    await wrapper.setProps({ exhibition: work(2) })
    await flushPromises()
    expect(wrapper.find('.like-feedback').text()).toContain('0 / 10')
    expect(wrapper.find('.like-button').attributes('disabled')).toBeUndefined()
  })
  it('counts only successful responses and permits a manual retry after failure', async () => {
    const wrapper = await mountWork()
    fetchLike.mockRejectedValueOnce(new Error('offline'))
    await wrapper.find('.like-button').trigger('click')
    await flushPromises()
    expect(window.localStorage.getItem(likeStorageKey(1))).toBeNull()
    expect(wrapper.text()).toContain('いいねを送信できませんでした')
    fetchLike.mockResolvedValueOnce({ exhibitionId: 1, likes: 1 })
    await wrapper.find('.like-button').trigger('click')
    await flushPromises()
    expect(window.localStorage.getItem(likeStorageKey(1))).toBe('1')
  })
  it('blocks repeated clicks and reopening the same work during a pending write', async () => {
    const request = deferred()
    fetchLike.mockReturnValueOnce(request.promise)
    const first = await mountWork()
    await first.find('.like-button').trigger('click')
    await first.find('.like-button').trigger('click')
    first.unmount()
    wrappers.splice(wrappers.indexOf(first), 1)
    const reopened = await mountWork()
    expect(reopened.find('.like-button').attributes('disabled')).toBeDefined()
    request.resolve({ exhibitionId: 1, likes: 1 })
    await flushPromises()
    expect(fetchLike).toHaveBeenCalledTimes(1)
    expect(reopened.find('.like-feedback').text()).toContain('1 / 10')
    expect(reopened.find('.like-button').attributes('disabled')).toBeUndefined()
  })
  it('stores a late success against the original work after switching works', async () => {
    const request = deferred()
    fetchLike.mockReturnValueOnce(request.promise)
    const wrapper = await mountWork()
    await wrapper.find('.like-button').trigger('click')
    await wrapper.setProps({ exhibition: work(2) })
    request.resolve({ exhibitionId: 1, likes: 7 })
    await flushPromises()
    expect(wrapper.find('.like-feedback').text()).toContain('0 / 10')
    expect(window.localStorage.getItem(likeStorageKey(1))).toBe('1')
    await wrapper.setProps({ exhibition: work(1) })
    expect(wrapper.find('.like-feedback').text()).toContain('1 / 10')
    expect(wrapper.find('.like-total').text()).toContain('7')
  })
  it('does not display a late failure in another work', async () => {
    const request = deferred()
    fetchLike.mockReturnValueOnce(request.promise)
    const wrapper = await mountWork()
    await wrapper.find('.like-button').trigger('click')
    await wrapper.setProps({ exhibition: work(2) })
    request.reject(new Error('offline'))
    await flushPromises()
    expect(wrapper.text()).not.toContain('いいねを送信できませんでした')
  })
  it('reflects another tab reaching the limit', async () => {
    const wrapper = await mountWork()
    window.localStorage.setItem(likeStorageKey(1), '10')
    window.dispatchEvent(new StorageEvent('storage', { key: likeStorageKey(1), newValue: '10' }))
    await flushPromises()
    expect(wrapper.find('.like-button').attributes('disabled')).toBeDefined()
  })
  it('clamps saved counts above the upper limit', async () => {
    window.localStorage.setItem(likeStorageKey(1), '999')
    const wrapper = await mountWork()
    expect(wrapper.find('.like-feedback').text()).toContain('10 / 10')
    expect(wrapper.find('.like-button').attributes('disabled')).toBeDefined()
  })
  it.each(['garbage', '-2', '1.5', 'Infinity'])(
    'recovers from malformed saved value %s',
    async (value) => {
      window.localStorage.setItem(likeStorageKey(1), value)
      const wrapper = await mountWork()
      expect(wrapper.find('.like-feedback').text()).toContain('0 / 10')
    },
  )
  it('falls back to page memory and explains the limitation if storage is unavailable', async () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('denied')
    })
    const wrapper = await mountWork()
    fetchLike.mockResolvedValueOnce({ exhibitionId: 1, likes: 1 })
    await wrapper.find('.like-button').trigger('click')
    await flushPromises()
    expect(wrapper.find('.like-feedback').text()).toContain('1 / 10')
    expect(wrapper.text()).toContain('再読み込みすると回数がリセット')
  })
  it('retains successful clicks in memory when reads work but writes fail', async () => {
    const originalStorage = window.localStorage
    vi.spyOn(window, 'localStorage', 'get').mockReturnValue({
      getItem: originalStorage.getItem.bind(originalStorage),
      setItem: () => {
        throw new Error('quota')
      },
    } as unknown as Storage)
    const wrapper = await mountWork()
    for (let count = 1; count <= 2; count++) {
      fetchLike.mockResolvedValueOnce({ exhibitionId: 1, likes: count })
      await wrapper.find('.like-button').trigger('click')
      await flushPromises()
    }
    expect(wrapper.find('.like-feedback').text()).toContain('2 / 10')
    expect(wrapper.text()).toContain('回数を保存できません')
  })
})
