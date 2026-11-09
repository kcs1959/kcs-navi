import { describe, expect, it } from 'vitest'
import { useNuxtApp, useRouter } from '#app'
import type { RouteLocationNormalized, Router } from 'vue-router'
import pageTransition from '~/middleware/page-transition.global'

function resolveRoute(router: Router, path: string): RouteLocationNormalized {
  const route = router.resolve(path)
  return { ...route, name: route.name ?? undefined, meta: {} }
}

function transitionFor(toPath: string, fromPath: string) {
  return useNuxtApp().runWithContext(() => {
    const router = useRouter()
    const to = resolveRoute(router, toPath)
    const from = resolveRoute(router, fromPath)
    pageTransition(to, from)
    return to.meta
  })
}

describe('menu page transitions', () => {
  it.each(['/', '/crowd', '/exhibitions', '/teams'])('fades from the menu to %s', (destination) => {
    expect(transitionFor(destination, '/menu')).toMatchObject({
      pageTransition: { name: 'page-fade', mode: 'out-in' },
    })
  })

  it.each(['/', '/crowd'])('slides into the menu from %s', (from) => {
    expect(transitionFor('/menu', from)).toMatchObject({
      pageTransition: { name: 'menu', mode: 'out-in' },
    })
  })

  it.each([
    ['/teams', '/exhibitions'],
    ['/teams/1', '/menu'],
    ['/checkin', '/menu'],
    ['/menu', '/menu'],
    ['/', '/'],
  ])('does not animate %s from %s', (to, from) => {
    expect(transitionFor(to, from)).toMatchObject({ pageTransition: false })
  })

  it('resets a transition when revisiting the same destination from another page', () => {
    useNuxtApp().runWithContext(() => {
      const router = useRouter()
      const to = resolveRoute(router, '/teams')
      pageTransition(to, resolveRoute(router, '/menu'))
      pageTransition(to, resolveRoute(router, '/exhibitions'))
      expect(to.meta).toMatchObject({ pageTransition: false })
    })
  })
})
