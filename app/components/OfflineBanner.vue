<script setup lang="ts">
const online = useOnline()
</script>

<template>
  <p v-if="!online" class="offline-banner" role="status">
    オフラインです。表示中の情報は最後に取得したときのものです。
  </p>
</template>

<style scoped>
.offline-banner {
  margin: 0 20px 12px;
  padding: 10px 14px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--lemon);
  font-size: 12px;
  line-height: 1.5;
  text-align: center;
}
</style>
