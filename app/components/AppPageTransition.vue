<script setup lang="ts">
const router = useRouter()
</script>

<template>
  <div
    :class="{ 'page-transition-enabled': Boolean(router.currentRoute.value.meta.pageTransition) }"
  >
    <!-- ラッパーを常設し、遷移元のページにもleaveフックを登録する。 -->
    <NuxtPage :transition="{ name: 'page-fade', mode: 'out-in' }" />
  </div>
</template>

<style>
.page-transition-enabled > .page-fade-enter-active,
.page-transition-enabled > .page-fade-leave-active {
  transition: opacity 100ms ease;
}
.page-transition-enabled > .page-fade-enter-from,
.page-transition-enabled > .page-fade-leave-to {
  opacity: 0;
}
</style>
