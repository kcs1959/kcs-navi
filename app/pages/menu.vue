<script setup lang="ts">
const { locale, t } = useI18n()

useHead(() => ({
  title: t('menu.meta.title'),
  htmlAttrs: { lang: locale.value === 'en' ? 'en' : 'ja' },
}))
</script>

<template>
  <MenuContent :show-close="false" />
</template>
