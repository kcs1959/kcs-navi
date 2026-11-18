import { afterEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import Welcome from '~/pages/welcome.vue'
import en from '../../i18n/locales/en.json'
import ja from '../../i18n/locales/ja.json'

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

  it('keeps the receipt data and formats it for the selected locale', async () => {
    const Host = defineComponent({
      components: { Welcome },
      setup() {
        const { locale, setLocaleMessage } = useI18n()
        setLocaleMessage('ja', ja)
        setLocaleMessage('en', en)
        locale.value = 'ja'
        const setTestLocale = (value: 'ja' | 'en') => {
          locale.value = value
        }
        return { setTestLocale }
      },
      template: `
        <button class="test-locale-ja" @click="setTestLocale('ja')">JP</button>
        <button class="test-locale-en" @click="setTestLocale('en')">EN</button>
        <Welcome />
      `,
    })
    const wrapper = await mountSuspended(Host, {
      route: '/welcome?checkedInAt=2026-11-05T10%3A00%3A00.000Z&visitorNumber=1234',
    })
    wrappers.push(wrapper)

    expect(wrapper.get('.visitor-number').text()).toBe('1,234人目')
    expect(wrapper.get('.receipt-time').text()).toContain('受付日時')

    await wrapper.get('.test-locale-en').trigger('click')
    await flushPromises()
    const expectedTime = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date('2026-11-05T10:00:00.000Z'))
    expect(wrapper.get('.visitor-number').text()).toBe('1,234')
    expect(wrapper.get('.receipt-time').text()).toBe(`Check-in time: ${expectedTime}`)
    expect(wrapper.text()).toContain("You're checked in!")

    await wrapper.get('.test-locale-ja').trigger('click')
  })
})
