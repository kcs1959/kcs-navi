import type { Exhibition, ExhibitionsResponse } from '../../shared/types'

export function useExhibitionDialog() {
  const selectedExhibition = useState<Exhibition | null>('selected-exhibition', () => null)
  const siblings = useState<Exhibition[]>('exhibition-siblings', () => [])
  const { data: exhibitionsData } = useNuxtData<ExhibitionsResponse>('exhibitions')
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
    if (exhibitionsData.value) {
      exhibitionsData.value = {
        ...exhibitionsData.value,
        exhibitions: exhibitionsData.value.exhibitions.map((item) =>
          item.id === id ? { ...item, likes } : item,
        ),
      }
    }
  }
  return { selectedExhibition, siblings, openExhibition, closeExhibition, updateLikes }
}
