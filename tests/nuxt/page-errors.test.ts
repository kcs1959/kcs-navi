import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import WorksPage from '~/pages/exhibitions.vue'
import CrowdPage from '~/pages/crowd.vue'

const mocks = vi.hoisted(() => ({ fetch: vi.fn(), crowd: vi.fn() }))
mockNuxtImport('useFetch', () => mocks.fetch)
mockNuxtImport('useCrowdStats', () => mocks.crowd)

function response(data: unknown, error: unknown = null) {
  return {
    data: ref(data),
    error: ref(error),
    status: ref(error ? 'error' : 'success'),
    refresh: vi.fn(),
  }
}

beforeEach(() => vi.clearAllMocks())

describe('page error recovery', () => {
  it('keeps every work visible when teams fail and retries only team information', async () => {
    const works = response({
      exhibitions: [
        {
          id: 1,
          teamId: 1,
          deskKey: 'desk-a',
          title: 'First work',
          description: '',
          creator: '',
          creatorComment: '',
          likes: 0,
        },
        {
          id: 2,
          teamId: 2,
          deskKey: 'desk-b',
          title: 'Second work',
          description: '',
          creator: '',
          creatorComment: '',
          likes: 0,
        },
      ],
    })
    // Stale team data must not leave a filter active while the message says all works are shown.
    const teams = response(
      { teams: [{ id: 1, key: 'one', name: 'Team one', description: '' }] },
      new Error('offline'),
    )
    mocks.fetch.mockImplementation((url: string) => (url === '/api/teams' ? teams : works))
    const wrapper = await mountSuspended(WorksPage, { route: '/exhibitions?team=1' })
    expect(wrapper.text()).toContain('First work')
    expect(wrapper.text()).toContain('Second work')
    expect(wrapper.find('[aria-label="班で絞り込む"]').exists()).toBe(false)
    await wrapper.get('.error-card button').trigger('click')
    expect(teams.refresh).toHaveBeenCalledOnce()
    expect(works.refresh).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('does not describe failed work loading as an empty exhibition list', async () => {
    const works = response(null, new Error('offline'))
    mocks.fetch.mockImplementation((url: string) =>
      url === '/api/teams' ? response({ teams: [] }) : works,
    )
    const wrapper = await mountSuspended(WorksPage, { route: '/exhibitions' })
    expect(wrapper.text()).toContain('展示情報を読み込めませんでした。')
    expect(wrapper.find('.empty-state').exists()).toBe(false)
    await wrapper.get('.error-card button').trigger('click')
    expect(works.refresh).toHaveBeenCalledOnce()
    wrapper.unmount()
  })

  it('offers one retry for failed crowd data and hides old totals', async () => {
    const crowd = response({ today: { count: 99 } }, new Error('offline'))
    mocks.crowd.mockReturnValue(crowd)
    const wrapper = await mountSuspended(CrowdPage, { route: '/crowd' })
    expect(wrapper.text()).toContain('混雑情報を取得できません')
    expect(wrapper.find('.attendance-card').exists()).toBe(false)
    expect(wrapper.findAll('button')).toHaveLength(1)
    await wrapper.get('button').trigger('click')
    expect(crowd.refresh).toHaveBeenCalledOnce()
    wrapper.unmount()
  })
})
