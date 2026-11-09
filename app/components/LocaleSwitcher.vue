<script setup lang="ts">
const { locale, setLocale } = useI18n()

const languageOptions = [
  { code: 'ja', label: 'JP', lang: 'ja', ariaKey: 'localeSwitcher.japanese' },
  { code: 'en', label: 'EN', lang: 'en', ariaKey: 'localeSwitcher.english' },
] as const
</script>

<template>
  <div class="locale-switcher" role="group" :aria-label="$t('localeSwitcher.ariaLabel')">
    <button
      v-for="option in languageOptions"
      :key="option.code"
      class="locale-option"
      :class="{ active: locale === option.code }"
      type="button"
      :aria-label="$t(option.ariaKey)"
      :aria-pressed="locale === option.code"
      @click="setLocale(option.code)"
    >
      <span :lang="option.lang">{{ option.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.locale-switcher {
  height: 44px;
  display: grid;
  grid-template-columns: repeat(2, 40px);
  align-items: center;
  gap: 2px;
  padding: 1px;
  border: 1px solid var(--kcs-line, #ead6c5);
  border-radius: 12px;
  background: var(--kcs-paper, #fff6ea);
}
.locale-option {
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--kcs-muted, #7d5b49);
  font: inherit;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
}
.locale-option.active {
  background: var(--kcs-peach, #ffd8bc);
  color: var(--kcs-ink, #4b2d22);
  font-weight: 700;
}
.locale-option:focus-visible {
  outline: 2px solid var(--kcs-orange, #ee8b4a);
  outline-offset: 1px;
}
</style>
