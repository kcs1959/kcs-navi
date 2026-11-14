export function useOnline() {
  // SSR では常にオンラインとして描画、マウント後に切り替える
  const deviceOnline = ref(true)
  const stale = ref(false)
  const update = () => {
    deviceOnline.value = navigator.onLine
  }
  const onMessage = (event: MessageEvent) => {
    if (event.data?.type === 'stale') stale.value = event.data.stale === true
  }
  onMounted(() => {
    update()
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    navigator.serviceWorker?.addEventListener('message', onMessage)
    navigator.serviceWorker?.controller?.postMessage({ type: 'stale?' })
  })
  onBeforeUnmount(() => {
    window.removeEventListener('online', update)
    window.removeEventListener('offline', update)
    navigator.serviceWorker?.removeEventListener('message', onMessage)
  })
  return computed(() => deviceOnline.value && !stale.value)
}
