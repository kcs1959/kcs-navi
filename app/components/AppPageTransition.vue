<script setup lang="ts">
const router = useRouter()
const transition = computed(() => router.currentRoute.value.meta.pageTransition)
const fadeEnabled = computed(
  () => typeof transition.value === 'object' && transition.value.name === 'page-fade',
)
</script>

<template>
  <div :class="{ 'page-transition-enabled': fadeEnabled }">
    <!-- ラッパーを常設し、遷移元のページにもleaveフックを登録する。 -->
    <NuxtPage :transition="transition || { name: 'page-fade', mode: 'out-in' }" />
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
