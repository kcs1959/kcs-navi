<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
    // 親要素（position: relative）全体を覆い、読み込み途中の描画を隠す。
    overlay?: boolean
  }>(),
  { label: '読み込み中', overlay: false },
)
</script>
<template>
  <div class="loading-indicator" :class="{ overlay }" role="status" aria-live="polite">
    <!-- マップの机と同じ配色・影で、机が順に置かれていく様子を表す。 -->
    <span class="loading-desks" aria-hidden="true">
      <span class="loading-desk lavender" />
      <span class="loading-desk mint" />
      <span class="loading-desk lemon" />
    </span>
    <span class="loading-label">{{ label }}</span>
  </div>
</template>
<style scoped>
.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px;
}
.overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  background: var(--paper);
  border-radius: inherit;
}
.loading-desks {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 40px;
}
.loading-desk {
  width: 24px;
  height: 16px;
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: 6px;
  animation: desk-drop 1.6s cubic-bezier(0.3, 0, 0.2, 1) infinite;
}
.lavender {
  box-shadow: 0 4px var(--lavender);
}
.mint {
  box-shadow: 0 4px var(--mint);
  animation-delay: 0.16s;
}
.lemon {
  box-shadow: 0 4px var(--lemon);
  animation-delay: 0.32s;
}
.loading-label {
  font-size: 12px;
  color: var(--muted);
}
/* 上から落ちて着地し、少し潰れて戻る。全机が揃った状態を一拍見せてから消える。 */
@keyframes desk-drop {
  0% {
    transform: translateY(-20px);
    opacity: 0;
  }
  20% {
    transform: translateY(0) scale(1.08, 0.88);
    opacity: 1;
  }
  30% {
    transform: translateY(-3px) scale(1);
  }
  40%,
  80% {
    transform: translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateY(0);
    opacity: 0;
  }
}
</style>
