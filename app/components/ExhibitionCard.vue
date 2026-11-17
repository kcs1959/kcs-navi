<script setup lang="ts">
import type { Exhibition, Team } from '../../shared/types'
const props = withDefaults(
  defineProps<{
    exhibition: Exhibition
    team?: Team
    showDescription?: boolean
    showLikes?: boolean
  }>(),
  { team: undefined, showDescription: true, showLikes: false },
)
const { totals } = useLocalLikes()
const likes = computed(() =>
  Math.max(props.exhibition.likes, totals.value[props.exhibition.id] ?? 0),
)
defineEmits<{ select: [] }>()
</script>
<template>
  <button
    class="card exhibition-card"
    :class="{ 'has-likes': showLikes }"
    :aria-label="
      showLikes
        ? $t('exhibitionCard.detailsWithLikesAriaLabel', {
            title: exhibition.title,
            likes: likes.toLocaleString('ja-JP'),
          })
        : $t('exhibitionCard.detailsAriaLabel', { title: exhibition.title })
    "
    @click="$emit('select')"
  >
    <span class="work-meta"
      ><span class="chip">{{ team?.name ?? $t('exhibitionCard.fallbackTeam') }}</span
      ><span>{{
        $t('exhibitionCard.desk', {
          desk: exhibition.deskKey.replace('desk-', '').toUpperCase(),
        })
      }}</span></span
    >
    <strong class="work-title">{{ exhibition.title }}</strong>
    <span v-if="showDescription" class="work-description">{{ exhibition.description }}</span>
    <span v-if="showLikes" class="work-likes" aria-hidden="true">
      <strong>{{ likes.toLocaleString('ja-JP') }}</strong>
      <span>いいね</span>
    </span>
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
.exhibition-card.has-likes {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  column-gap: 16px;
}
.has-likes > :not(.work-likes) {
  grid-column: 1;
}
.work-likes {
  grid-column: 2;
  grid-row: 1 / span 3;
  align-self: center;
  display: grid;
  gap: 2px;
  text-align: center;
  color: var(--muted);
  font-size: 10px;
}
.work-likes strong {
  color: var(--like-accent);
  font-size: 20px;
  font-variant-numeric: tabular-nums;
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
