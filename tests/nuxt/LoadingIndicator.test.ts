import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import LoadingIndicator from '~/components/LoadingIndicator.vue'

describe('LoadingIndicator', () => {
  it('announces the label as a status and hides the animation from assistive tech', async () => {
    const wrapper = await mountSuspended(LoadingIndicator, {
      props: { label: 'マップを準備しています' },
    })

    const status = wrapper.get('[role="status"]')
    expect(status.text()).toBe('マップを準備しています')
    expect(wrapper.get('.loading-desks').attributes('aria-hidden')).toBe('true')
    expect(status.classes()).not.toContain('overlay')
  })

  it('covers its parent only when used as an overlay', async () => {
    const wrapper = await mountSuspended(LoadingIndicator, { props: { overlay: true } })

    expect(wrapper.get('[role="status"]').classes()).toContain('overlay')
    expect(wrapper.text()).toBe('読み込み中')
  })
})
