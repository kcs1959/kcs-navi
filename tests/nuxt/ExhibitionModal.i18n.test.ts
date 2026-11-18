import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { clearNuxtState, useNuxtApp } from '#app'
import ExhibitionModal from '~/components/ExhibitionModal.vue'
import { likeStorageKey } from '~/composables/useLocalLikes'
import en from '../../i18n/locales/en.json'
import ja from '../../i18n/locales/ja.json'
import type { Exhibition, Team } from '../../shared/types'

const fetchLike = vi.hoisted(() => vi.fn())
mockNuxtImport('$fetch', () => fetchLike)

const stateKeys = [
  'local-like-counts',
  'local-like-totals',
  'local-like-pending',
  'local-like-storage',
]
const exhibition: Exhibition = {
  id: 1,
  teamId: 1,
  deskKey: 'desk-a',
  title: 'API作品名',
  description: 'API作品説明',
  creatorComment: 'API制作者コメント',
  likes: 12,
}
const team: Team = {
  id: 1,
  key: 'api-team',
  name: 'API班名',
  description: 'API班説明',
}

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
  vi.restoreAllMocks()
  window.localStorage.clear()
  resetState()
})

describe('ExhibitionModal i18n', () => {
  it('switches fixed copy without posting or changing the saved like count', async () => {
    window.localStorage.setItem(likeStorageKey(exhibition.id), '2')
    const Host = defineComponent({
      components: { ExhibitionModal },
      setup() {
        const { locale, setLocaleMessage } = useI18n()
        setLocaleMessage('ja', ja)
        setLocaleMessage('en', en)
        const setTestLocale = (value: 'ja' | 'en') => {
          locale.value = value
        }
        return { exhibition, team, setTestLocale }
      },
      template: `
        <button class="test-locale-ja" @click="setTestLocale('ja')">JP</button>
        <button class="test-locale-en" @click="setTestLocale('en')">EN</button>
        <ExhibitionModal :exhibition="exhibition" :team="team" :siblings="[exhibition]" />
      `,
    })
    const wrapper = await mountSuspended(Host)
    await flushPromises()

    await wrapper.get('.test-locale-ja').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('所属班 API班名 ／ 展示場所 A')
    expect(wrapper.text()).toContain('制作者より')
    expect(wrapper.get('.close-detail').attributes('aria-label')).toBe('作品詳細を閉じる')

    await wrapper.get('.test-locale-en').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Team: API班名 / Location: A')
    expect(wrapper.text()).toContain('From the creator')
    expect(wrapper.text()).toContain('API作品名')
    expect(wrapper.text()).toContain('API作品説明')
    expect(wrapper.text()).toContain('API制作者コメント')
    expect(wrapper.get('.close-detail').attributes('aria-label')).toBe('Close exhibition details')
    expect(wrapper.get('.like-button').attributes('aria-label')).toBe('Like this work (2 / 10)')
    expect(wrapper.text()).toContain('Your likes: 2 / 10.')
    expect(fetchLike).not.toHaveBeenCalled()
    expect(window.localStorage.getItem(likeStorageKey(exhibition.id))).toBe('2')

    await wrapper.get('.test-locale-ja').trigger('click')
    wrapper.unmount()
  })
})
