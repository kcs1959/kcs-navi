export function useOnline() {
  // SSR では常にオンラインとして描画、マウント後に切り替える
  const online = ref(true)
  const update = () => {
    online.value = navigator.onLine
  }
  onMounted(() => {
    update()
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
  })
  onBeforeUnmount(() => {
    window.removeEventListener('online', update)
    window.removeEventListener('offline', update)
  })
  return online
}
