import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import OfflineBanner from '~/components/OfflineBanner.vue'
import ExhibitionModal from '~/components/ExhibitionModal.vue'
import type { Exhibition } from '../../shared/types'

const wrappers: Array<{ unmount(): void }> = []
function setOnline(value: boolean, event?: 'online' | 'offline') {
  Object.defineProperty(navigator, 'onLine', { value, configurable: true })
  if (event) window.dispatchEvent(new Event(event))
}
const work: Exhibition = {
  id: 1,
  teamId: 1,
  deskKey: 'desk-a',
  title: '作品1',
  description: '',
  creatorComment: '',
  likes: 0,
}

beforeEach(() => {
  setOnline(true)
  vi.spyOn(HTMLDialogElement.prototype, 'showModal').mockImplementation(() => {})
  vi.spyOn(HTMLDialogElement.prototype, 'close').mockImplementation(() => {})
})
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  vi.restoreAllMocks()
  setOnline(true)
})

describe('OfflineBanner', () => {
  it('stays hidden online, appears on offline and disappears on online', async () => {
    const wrapper = await mountSuspended(OfflineBanner)
    wrappers.push(wrapper)
    expect(wrapper.find('[role="status"]').exists()).toBe(false)

    setOnline(false, 'offline')
    await flushPromises()
    expect(wrapper.get('[role="status"]').text()).toContain('オフラインです')

    setOnline(true, 'online')
    await flushPromises()
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })
  it('appears while the service worker answers from cache', async () => {
    const serviceWorker = Object.assign(new EventTarget(), { controller: { postMessage: vi.fn() } })
    Object.defineProperty(navigator, 'serviceWorker', { value: serviceWorker, configurable: true })
    const send = (stale: boolean) =>
      serviceWorker.dispatchEvent(new MessageEvent('message', { data: { type: 'stale', stale } }))
    try {
      const wrapper = await mountSuspended(OfflineBanner)
      wrappers.push(wrapper)
      expect(serviceWorker.controller.postMessage).toHaveBeenCalledWith({ type: 'stale?' })

      send(true)
      await flushPromises()
      expect(wrapper.get('[role="status"]').text()).toContain('オフラインです')

      send(false)
      await flushPromises()
      expect(wrapper.find('[role="status"]').exists()).toBe(false)
    } finally {
      Reflect.deleteProperty(navigator, 'serviceWorker')
    }
  })
  it('reads the offline state present at mount', async () => {
    setOnline(false)
    const wrapper = await mountSuspended(OfflineBanner)
    wrappers.push(wrapper)
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
  })
})

describe('ExhibitionModal offline', () => {
  it('disables the like button offline and explains why', async () => {
    const wrapper = await mountSuspended(ExhibitionModal, {
      props: { exhibition: work, siblings: [work] },
    })
    wrappers.push(wrapper)
    await flushPromises()
    expect(wrapper.find('.like-button').attributes('disabled')).toBeUndefined()

    setOnline(false, 'offline')
    await flushPromises()
    expect(wrapper.find('.like-button').attributes('disabled')).toBeDefined()
    expect(wrapper.find('.like-button').classes()).toContain('is-offline')
    expect(wrapper.text()).toContain('オフラインのため送信できません')
  })
})
