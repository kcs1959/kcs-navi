import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import Checkin from '~/pages/checkin.vue'
import en from '../../i18n/locales/en.json'
import ja from '../../i18n/locales/ja.json'

const wrappers: Array<{ unmount(): void }> = []

afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount())
  vi.restoreAllMocks()
})

function testHost() {
  return defineComponent({
    components: { Checkin },
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
      <Checkin />
    `,
  })
}

describe('check-in i18n', () => {
  it('submits exactly once and does not resubmit when the locale changes', async () => {
    const submit = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {})
    const wrapper = await mountSuspended(testHost(), { route: '/checkin' })
    wrappers.push(wrapper)
    await flushPromises()

    expect(submit).toHaveBeenCalledTimes(1)
    expect(wrapper.get('form').attributes()).toMatchObject({
      method: 'post',
      action: '/api/checkins',
    })

    await wrapper.get('.test-locale-en').trigger('click')
    await flushPromises()
    expect(wrapper.get('#checkin-heading').text()).toBe('Checking you in')
    expect(submit).toHaveBeenCalledTimes(1)

    await wrapper.get('.test-locale-ja').trigger('click')
  })

  it('does not submit on an error page and translates the error', async () => {
    const submit = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => {})
    const wrapper = await mountSuspended(testHost(), { route: '/checkin?error=busy' })
    wrappers.push(wrapper)
    await flushPromises()

    expect(submit).not.toHaveBeenCalled()
    expect(wrapper.find('form').exists()).toBe(false)

    await wrapper.get('.test-locale-en').trigger('click')
    await flushPromises()
    expect(wrapper.get('#checkin-heading').text()).toBe("We couldn't complete your check-in")
    expect(wrapper.get('[role="alert"]').text()).toContain('currently busy')

    await wrapper.get('.test-locale-ja').trigger('click')
  })
})
