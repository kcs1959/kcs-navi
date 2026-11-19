<script setup lang="ts">
defineProps<{ eyebrow?: string; title: string; description?: string }>()
</script>
<template>
  <div class="page-heading">
    <h1>{{ title }}</h1>
    <p v-if="description" class="heading-description">{{ description }}</p>
  </div>
</template>
