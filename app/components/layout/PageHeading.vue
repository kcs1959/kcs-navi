<script setup lang="ts">
defineProps<{ title: string }>()
</script>
<template>
  <div class="page-heading">
    <h1>{{ title }}</h1>
  </div>
</template>
