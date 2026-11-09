import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearNuxtState, useNuxtApp } from '#app'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ThemeToggle from '~/components/ThemeToggle.vue'

function resetTheme() {
  useNuxtApp().runWithContext(() => clearNuxtState(['theme', 'theme-ready']))
  delete document.documentElement.dataset.theme
}

beforeEach(resetTheme)
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  resetTheme()
})

describe('theme toggle', () => {
  it('restores the pre-render theme and persists changes across component mounts', async () => {
    // head内の初期化スクリプトが復元した属性を引き継ぐ。
    document.documentElement.dataset.theme = 'dark'
    const save = vi.fn()
    vi.stubGlobal('localStorage', { setItem: save })
    const button = await mountSuspended(ThemeToggle)

    expect(button.attributes('aria-pressed')).toBe('true')
    await button.trigger('click')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(save).toHaveBeenCalledWith('kcs-navi-theme', 'light')
    button.unmount()

    const remounted = await mountSuspended(ThemeToggle)
    expect(remounted.attributes('aria-pressed')).toBe('false')
    await remounted.trigger('click')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(save).toHaveBeenLastCalledWith('kcs-navi-theme', 'dark')
    remounted.unmount()
  })

  it('defaults to light and still switches when storage is unavailable', async () => {
    vi.stubGlobal('localStorage', {
      setItem() {
        throw new Error('Storage unavailable')
      },
    })
    const button = await mountSuspended(ThemeToggle)
    expect(button.attributes('aria-pressed')).toBe('false')
    await button.trigger('click')
    expect(button.attributes('aria-pressed')).toBe('true')
    expect(document.documentElement.dataset.theme).toBe('dark')
    button.unmount()
  })
})
