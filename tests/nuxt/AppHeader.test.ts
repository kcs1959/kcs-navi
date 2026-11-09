import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { nextTick } from 'vue'
import AppHeader from '~/components/AppHeader.vue'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('AppHeader', () => {
  it('slides in only after leaving the viewport and stays until its original position returns', async () => {
    let top = 20
    let width = 480
    let height = 76
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      return {
        top: this.classList.contains('header-slot') ? top : 0,
        left: 20,
        width,
        height,
      } as DOMRect
    })
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0)
      return 0
    })
    const wrapper = await mountSuspended(AppHeader)
    const scrollTo = async (offset: number) => {
      top = offset
      window.dispatchEvent(new Event('scroll'))
      await nextTick()
    }

    try {
      await scrollTo(-75)
      expect(wrapper.get('header').classes()).not.toContain('is-floating')
      await scrollTo(-76)
      expect(wrapper.get('header').classes()).toContain('is-floating')
      expect(wrapper.get('.header-slot').attributes('style')).toContain('height: 76px')
      expect(wrapper.get('header').attributes('style')).toContain('width: 480px')
      expect(wrapper.findAll('header')).toHaveLength(1)

      await scrollTo(-30)
      expect(wrapper.get('header').classes()).toContain('is-floating')

      width = 350
      height = 127
      window.dispatchEvent(new Event('resize'))
      await nextTick()
      expect(wrapper.get('.header-slot').attributes('style')).toContain('height: 127px')
      expect(wrapper.get('header').attributes('style')).toContain('width: 350px')

      await scrollTo(0)
      expect(wrapper.get('header').classes()).not.toContain('is-floating')
      expect(wrapper.get('.header-slot').attributes('style') || '').not.toContain('height:')
    } finally {
      wrapper.unmount()
    }
  })
})
