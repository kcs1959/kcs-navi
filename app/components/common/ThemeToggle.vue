<script setup lang="ts">
const { theme, ready, toggleTheme } = useTheme()
</script>

<template>
  <button
    type="button"
    class="icon-button theme-toggle"
    aria-label="ダークモード"
    title="ダークモード"
    :aria-pressed="theme === 'dark'"
    :disabled="!ready"
    @click="toggleTheme"
  >
    <!-- SSR〜マウント前は theme が常に light のため、アイコンは head スクリプトが設定する
         html[data-theme] で出し分け、読み込み直後のアイコンの入れ替わりを防ぐ。 -->
    <svg
      class="theme-toggle-sun"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <path
        d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
      />
    </svg>
    <svg
      class="theme-toggle-moon"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z"
        stroke="currentColor"
        fill="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </button>
</template>

<style scoped>
.theme-toggle {
  flex-shrink: 0;
}
.theme-toggle:disabled {
  cursor: default;
}
</style>

<style>
html:not([data-theme='dark']) .theme-toggle-moon,
html[data-theme='dark'] .theme-toggle-sun {
  display: none;
}
html[data-theme='dark'] .theme-toggle {
  background: var(--peach);
}
</style>
