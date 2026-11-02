export function useCrowdStats(options: { poll?: boolean } = {}) {
  const result = useFetch('/api/checkins/stats', { key: 'crowd-stats', dedupe: 'defer' })
  let interval: ReturnType<typeof setInterval> | undefined
  function refreshVisible() {
    if (document.visibilityState === 'visible') void result.refresh()
  }
  onMounted(() => {
    if (options.poll === false) return
    // 非表示のタブでは通信を止め、戻った瞬間に更新して古い推定値の表示を防ぐ。
    interval = setInterval(refreshVisible, 30_000)
    document.addEventListener('visibilitychange', refreshVisible)
  })
  onBeforeUnmount(() => {
    clearInterval(interval)
    document.removeEventListener('visibilitychange', refreshVisible)
  })
  return result
}
