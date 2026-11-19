import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { clearNuxtState, useNuxtApp, useNuxtData } from '#app'
import { useExhibitionDialog } from '~/composables/useExhibitionDialog'
import type { Exhibition, ExhibitionsResponse } from '../../shared/types'

function createExhibition(id: number, likes: number): Exhibition {
  return {
    id,
    teamId: 1,
    deskKey: 'desk-a',
    title: `作品${id}`,
    description: '',
    creator: '',
          creatorComment: '',
    likes,
  }
}

function createDialog() {
  return useNuxtApp().runWithContext(() => useExhibitionDialog())
}

async function resetDialogState() {
  // Nuxt の共有状態をテスト間で持ち越さず、他のアプリ状態には触れない。
  await useNuxtApp().runWithContext(async () => {
    clearNuxtState(['selected-exhibition', 'exhibition-siblings'])
    const exhibitionCache = await useNuxtData<ExhibitionsResponse>('exhibitions')
    exhibitionCache.data.value = undefined
  })
}

beforeEach(resetDialogState)
afterEach(resetDialogState)

describe('useExhibitionDialog in the Nuxt runtime', () => {
  it('shares a single selected work across the page and dialog, then closes it', async () => {
    const page = await createDialog()
    const dialog = await createDialog()
    const exhibition = createExhibition(1, 2)

    expect(page.selectedExhibition.value).toBeNull()
    expect(page.siblings.value).toEqual([])

    page.openExhibition(exhibition)

    expect(dialog.selectedExhibition.value).toEqual(exhibition)
    expect(dialog.siblings.value).toEqual([exhibition])

    dialog.closeExhibition()

    expect(page.selectedExhibition.value).toBeNull()
  })

  it('keeps each work’s likes separate while switching between works at the same desk', async () => {
    const dialog = await createDialog()
    const first = createExhibition(1, 2)
    const second = createExhibition(2, 7)
    const exhibitionCache = await useNuxtApp().runWithContext(async () =>
      useNuxtData<ExhibitionsResponse>('exhibitions'),
    )
    exhibitionCache.data.value = { exhibitions: [first, second] }

    // 前のテストで開いた作品・候補が残っていないことも確認する。
    expect(dialog.selectedExhibition.value).toBeNull()
    expect(dialog.siblings.value).toEqual([])

    dialog.openExhibition(first, [first, second])
    dialog.updateLikes(second.id, 8)

    expect(dialog.selectedExhibition.value).toEqual(first)
    expect(dialog.siblings.value.map(({ id, likes }) => ({ id, likes }))).toEqual([
      { id: first.id, likes: 2 },
      { id: second.id, likes: 8 },
    ])

    dialog.openExhibition(dialog.siblings.value[1]!, dialog.siblings.value)
    // 切り替え前の作品への応答が遅れて届いても、表示中の作品を書き換えない。
    dialog.updateLikes(first.id, 3)
    expect(dialog.selectedExhibition.value).toMatchObject({ id: second.id, likes: 8 })

    dialog.updateLikes(second.id, 9)
    expect(dialog.selectedExhibition.value).toMatchObject({ id: second.id, likes: 9 })
    expect(dialog.siblings.value.map(({ id, likes }) => ({ id, likes }))).toEqual([
      { id: first.id, likes: 3 },
      { id: second.id, likes: 9 },
    ])
    expect(exhibitionCache.data.value?.exhibitions.map(({ id, likes }) => ({ id, likes }))).toEqual(
      [
        { id: first.id, likes: 3 },
        { id: second.id, likes: 9 },
      ],
    )
  })
})
