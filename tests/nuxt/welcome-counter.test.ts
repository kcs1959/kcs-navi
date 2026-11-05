import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import Welcome from '~/pages/welcome.vue'

const wrappers: Array<{ unmount(): void }> = []
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
})
describe('Welcome visitor receipt', () => {
  it('displays the number carried by the completed check-in', async () => {
    const wrapper = await mountSuspended(Welcome, {
      route: '/welcome?checkedInAt=2026-11-05T10%3A00%3A00.000Z&visitorNumber=23',
    })
    wrappers.push(wrapper)
    expect(wrapper.find('.visitor-message').text().replace(/\s/g, '')).toBe(
      'あなたは本日23人目の来場者です！',
    )
    expect(wrapper.find('.visitor-number').text()).toBe('23人目')
    expect(wrapper.text()).toContain('受付日時')
    expect(wrapper.find('form').exists()).toBe(false)
  })
  it.each([
    '/welcome',
    '/welcome?visitorNumber=23',
    '/welcome?checkedInAt=bad&visitorNumber=23',
    '/welcome?checkedInAt=2026-11-05T10%3A00%3A00.000Z&visitorNumber=0',
  ])('does not invent a visitor position for %s', async (route) => {
    const wrapper = await mountSuspended(Welcome, { route })
    wrappers.push(wrapper)
    expect(wrapper.find('.visitor-message').exists()).toBe(false)
    expect(wrapper.find('a[href="/"]').exists()).toBe(true)
  })
})
