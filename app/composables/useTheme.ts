type Theme = 'light' | 'dark'

const storageKey = 'kcs-navi-theme'

export function useTheme() {
  const theme = useState<Theme>('theme', () => 'light')
  const ready = useState<boolean>('theme-ready', () => false)

  // SSRではlocalStorageを読めないため、描画前に実行するhead内のスクリプトで復元する。
  // HTML属性はこのスクリプトとtoggleThemeで管理し、hydration時に上書きしない。
  useHead({
    script: [
      {
        key: 'theme-init',
        tagPosition: 'head',
        innerHTML: `(function(){var theme='light';try{if(localStorage.getItem('${storageKey}')==='dark')theme='dark'}catch(e){}document.documentElement.dataset.theme=theme})()`,
      },
    ],
  })

  onMounted(() => {
    theme.value = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
    ready.value = true
  })

  function toggleTheme() {
    if (!import.meta.client || !ready.value) return

    theme.value = theme.value === 'light' ? 'dark' : 'light'
    document.documentElement.dataset.theme = theme.value
    try {
      localStorage.setItem(storageKey, theme.value)
    } catch {
      // ストレージが利用できなくても、現在の画面では切り替えを有効にする。
    }
  }

  return { theme: readonly(theme), ready: readonly(ready), toggleTheme }
}
