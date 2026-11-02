<script setup lang="ts">
import type { Exhibition, Team } from '../../shared/types'
const props = withDefaults(
  defineProps<{
    exhibition: Exhibition
    team?: Team
    illustration?: string
    showDescription?: boolean
  }>(),
  { team: undefined, illustration: undefined, showDescription: true },
)
defineEmits<{ select: [] }>()
const artwork = computed(
  () =>
    props.illustration ??
    (props.exhibition.deskKey === 'desk-b'
      ? '/figma/works-frame1.svg'
      : props.exhibition.deskKey === 'desk-c'
        ? '/figma/works-frame2.svg'
        : '/figma/works-frame.svg'),
)
const tint = computed(() =>
  props.exhibition.deskKey === 'desk-b'
    ? 'var(--mint)'
    : props.exhibition.deskKey === 'desk-c'
      ? 'var(--lemon)'
      : 'var(--lavender)',
)
</script>
<template>
  <button
    class="card exhibition-card"
    :aria-label="`${exhibition.title}の詳細を見る`"
    @click="$emit('select')"
  >
    <span class="artwork" :style="{ background: tint }"
      ><img :src="artwork" alt="" width="302" height="124" loading="lazy"
    /></span>
    <span class="work-meta"
      ><span class="chip" :style="{ background: tint }">{{ team?.name ?? '展示作品' }}</span
      ><span>展示 {{ exhibition.deskKey.replace('desk-', '').toUpperCase() }}</span></span
    >
    <strong class="work-title">{{ exhibition.title }}</strong>
    <span v-if="showDescription" class="work-description">{{ exhibition.description }}</span>
  </button>
</template>
<style scoped>
.exhibition-card {
  width: 100%;
  /* 枠線1pxを含む20pxの余白にし、390px画面で素材の実寸302pxを保つ。 */
  padding: 19px;
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
.artwork {
  display: block;
  overflow: hidden;
  border-radius: 20px;
}
.artwork img {
  display: block;
  max-width: 100%;
  height: auto;
  margin: auto;
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
