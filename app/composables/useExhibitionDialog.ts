import type { Exhibition } from '../../shared/types'

export function useExhibitionDialog() {
  const selectedExhibition = useState<Exhibition | null>('selected-exhibition', () => null)
  const siblings = useState<Exhibition[]>('exhibition-siblings', () => [])
  function openExhibition(exhibition: Exhibition, alternatives: Exhibition[] = [exhibition]) {
    siblings.value = alternatives
    selectedExhibition.value = exhibition
  }
  function closeExhibition() {
    selectedExhibition.value = null
  }
  function updateLikes(id: number, likes: number) {
    siblings.value = siblings.value.map((item) => (item.id === id ? { ...item, likes } : item))
    if (selectedExhibition.value?.id === id)
      selectedExhibition.value = { ...selectedExhibition.value, likes }
  }
  return { selectedExhibition, siblings, openExhibition, closeExhibition, updateLikes }
}
