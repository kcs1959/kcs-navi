<script setup lang="ts">
const { theme, ready, toggleTheme } = useTheme()
</script>

<template>
  <button
    type="button"
    class="icon-button theme-toggle"
    aria-label="ダークモード"
    :aria-pressed="theme === 'dark'"
    :disabled="!ready"
    @click="toggleTheme"
  >
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z"
        stroke="currentColor"
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
.theme-toggle[aria-pressed='true'] {
  box-shadow: inset 0 0 0 2px var(--orange);
}
</style>
