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
  'install-prompt-chrome',
  'install-prompt-listening',
]
const safariUA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'
const androidChromeUA =
  'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36'
const iosChromeUA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/130.0.0.0 Mobile/15E148 Safari/604.1'
function setUserAgent(value: string) {
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(value)
}
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
  vi.restoreAllMocks()
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
    setUserAgent(safariUA)
    setStandalone(false)
    const wrapper = await mountGuide()
    expect(wrapper.get('#install-heading').text()).toBe('ホーム画面に追加')
    expect(wrapper.text()).toContain('共有')
    expect(wrapper.text()).toContain('ホーム画面に追加')
    expect(wrapper.find('.install-card button').exists()).toBe(false)
  })
  it.each([
    ['Android Chrome', androidChromeUA, undefined, '︙'],
    ['iOS Chrome', iosChromeUA, false, '共有'],
  ] as const)(
    'shows a button and Chrome steps without a prompt on %s',
    async (_name, ua, standalone, step) => {
      setUserAgent(ua)
      setStandalone(standalone)
      const wrapper = await mountGuide()
      const button = wrapper.get('.install-card button')
      expect(button.text()).toBe('ホーム画面に追加する')
      expect(wrapper.find('#chrome-install-steps').exists()).toBe(false)
      expect(wrapper.text()).not.toContain('Safari 下部')
      await button.trigger('click')
      expect(wrapper.find('#chrome-install-steps').exists()).toBe(true)
      expect(wrapper.get('#chrome-install-steps').text()).toContain(step)
      expect(button.attributes('aria-expanded')).toBe('true')
      await button.trigger('click')
      expect(wrapper.find('#chrome-install-steps').exists()).toBe(false)
    },
  )
  it('uses the native prompt when it arrives after showing Chrome steps', async () => {
    setUserAgent(androidChromeUA)
    const wrapper = await mountGuide()
    await wrapper.get('.install-card button').trigger('click')
    const event = installPrompt()
    await flushPromises()
    expect(wrapper.find('#chrome-install-steps').exists()).toBe(false)
    await wrapper.get('.install-card button').trigger('click')
    expect(event.prompt).toHaveBeenCalledTimes(1)
  })
  it.each([
    ['Android Edge', `${androidChromeUA} EdgA/130.0.0.0`, undefined],
    ['Android WebView', androidChromeUA.replace('Pixel 9)', 'Pixel 9; wv)'), undefined],
    ['iOS Firefox', iosChromeUA.replace('CriOS/', 'FxiOS/'), false],
  ] as const)(
    'does not show Chrome or Safari instructions for %s',
    async (_name, ua, standalone) => {
      setUserAgent(ua)
      setStandalone(standalone)
      const wrapper = await mountGuide()
      expect(wrapper.find('.install-card').exists()).toBe(false)
    },
  )
  it.each([
    ['display-mode standalone', () => setDisplayModeStandalone(true)],
    ['navigator.standalone', () => setStandalone(true)],
  ])('hides the guide when already installed via %s', async (_label, arrange) => {
    setUserAgent(androidChromeUA)
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
