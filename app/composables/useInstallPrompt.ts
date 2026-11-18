// Chromium 系ブラウザ向け
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
}

export function useInstallPrompt() {
  const promptEvent = useState<BeforeInstallPromptEvent | null>('install-prompt-event', () => null)
  const installed = useState('install-prompt-installed', () => false)
  const iosSafari = useState('install-prompt-ios', () => false)
  const mobileChrome = useState<'android' | 'ios' | null>('install-prompt-chrome', () => null)
  const listening = useState('install-prompt-listening', () => false)

  if (import.meta.client && !listening.value) {
    listening.value = true
    // beforeinstallprompt は 1 度しか発火しないので、最初に呼ばれた場所 (app.vue) で購読する
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault()
      promptEvent.value = markRaw(event as BeforeInstallPromptEvent)
    })
    window.addEventListener('appinstalled', () => {
      installed.value = true
      promptEvent.value = null
    })
    // SSR の描画 (案内なし) と食い違わせないようにする
    onMounted(() => {
      const { standalone } = navigator as Navigator & { standalone?: boolean }
      installed.value =
        standalone === true || window.matchMedia('(display-mode: standalone)').matches
      const ua = navigator.userAgent
      // iOS Chrome は Safari と同じ standalone プロパティを持つため先に区別する。
      if (/CriOS\//.test(ua)) {
        mobileChrome.value = 'ios'
      } else if (
        /Android/.test(ua) &&
        /Chrome\//.test(ua) &&
        !/EdgA\/|OPR\/|SamsungBrowser\/|; wv\)/.test(ua)
      ) {
        mobileChrome.value = 'android'
      }
      iosSafari.value =
        standalone === false && /Safari\//.test(ua) && !/CriOS\/|FxiOS\/|EdgiOS\/|OPiOS\//.test(ua)
    })
  }

  async function install() {
    await promptEvent.value?.prompt()
  }

  return { promptEvent, installed, iosSafari, mobileChrome, install }
}
