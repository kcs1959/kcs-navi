<script setup lang="ts">
import type { Exhibition, Team } from '../../shared/types'
withDefaults(
  defineProps<{
    exhibition: Exhibition
    team?: Team
    showDescription?: boolean
  }>(),
  { team: undefined, showDescription: true },
)
defineEmits<{ select: [] }>()
</script>
<template>
  <button
    class="card exhibition-card"
    :aria-label="`${exhibition.title}の詳細を見る`"
    @click="$emit('select')"
  >
    <span class="work-meta"
      ><span class="chip">{{ team?.name ?? '展示作品' }}</span
      ><span>展示 {{ exhibition.deskKey.replace('desk-', '').toUpperCase() }}</span></span
    >
    <strong class="work-title">{{ exhibition.title }}</strong>
    <span v-if="showDescription" class="work-description">{{ exhibition.description }}</span>
  </button>
</template>
<style scoped>
.exhibition-card {
  width: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
  text-align: left;
  border-radius: 20px;
}
.exhibition-card:hover {
  border-color: var(--orange);
}
.work-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-size: 10px;
}
.work-title {
  font-size: 18px;
}
.work-description {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.8;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
