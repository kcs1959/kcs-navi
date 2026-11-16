import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { clearNuxtState, useNuxtApp } from '#app'
import MenuPage from '~/pages/menu.vue'

const wrappers: Array<{ unmount(): void }> = []
const stateKeys = [
  'install-prompt-event',
  'install-prompt-installed',
  'install-prompt-ios',
  'install-prompt-listening',
]
function resetState() {
  useNuxtApp().runWithContext(() => clearNuxtState(stateKeys))
}
function setStandalone(value: boolean | undefined) {
  if (value === undefined) delete (navigator as { standalone?: boolean }).standalone
  else Object.defineProperty(navigator, 'standalone', { value, configurable: true })
}
function setDisplayModeStandalone(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches }) as MediaQueryList),
  )
}
function installPrompt() {
  const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt: vi.fn(),
  })
  window.dispatchEvent(event)
  return event
}
async function mountGuide() {
  const wrapper = await mountSuspended(MenuPage)
  wrappers.push(wrapper)
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  resetState()
  setStandalone(undefined)
  setDisplayModeStandalone(false)
})
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  vi.unstubAllGlobals()
  setStandalone(undefined)
  resetState()
})

describe('InstallGuide', () => {
  it('shows nothing in a browser without an install path', async () => {
    const wrapper = await mountGuide()
    expect(wrapper.find('.install-card').exists()).toBe(false)
  })
  it('offers an install button after beforeinstallprompt and prompts on click', async () => {
    const wrapper = await mountGuide()
    const event = installPrompt()
    await flushPromises()
    expect(event.defaultPrevented).toBe(true)
    expect(wrapper.get('#install-heading').text()).toBe('ホーム画面に追加')
    expect(wrapper.text()).not.toContain('共有')
    await wrapper.get('.install-card button').trigger('click')
    expect(event.prompt).toHaveBeenCalledTimes(1)
  })
  it('shows the share steps on iOS Safari without a button', async () => {
    setStandalone(false)
    const wrapper = await mountGuide()
    expect(wrapper.get('#install-heading').text()).toBe('ホーム画面に追加')
    expect(wrapper.text()).toContain('共有')
    expect(wrapper.text()).toContain('ホーム画面に追加')
    expect(wrapper.find('.install-card button').exists()).toBe(false)
  })
  it.each([
    ['display-mode standalone', () => setDisplayModeStandalone(true)],
    ['navigator.standalone', () => setStandalone(true)],
  ])('hides the guide when already installed via %s', async (_label, arrange) => {
    arrange()
    const wrapper = await mountGuide()
    installPrompt()
    await flushPromises()
    expect(wrapper.find('.install-card').exists()).toBe(false)
  })
  it('hides the guide once appinstalled fires', async () => {
    const wrapper = await mountGuide()
    installPrompt()
    await flushPromises()
    expect(wrapper.find('.install-card').exists()).toBe(true)
    window.dispatchEvent(new Event('appinstalled'))
    await flushPromises()
    expect(wrapper.find('.install-card').exists()).toBe(false)
  })
})
