<script setup lang="ts">
const { t } = useI18n()

useHead(() => ({ title: t('menu.meta.title') }))
</script>

<template>
  <MenuContent :show-close="false" />
</template>
