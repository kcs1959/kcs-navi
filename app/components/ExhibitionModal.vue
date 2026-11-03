<script setup lang="ts">
import type { Exhibition, Team } from '../../shared/types'
const props = defineProps<{
  exhibition: Exhibition
  team?: Team
  teamError?: boolean
  siblings: Exhibition[]
}>()
const emit = defineEmits<{ close: []; select: [exhibition: Exhibition]; retryTeams: [] }>()
const dialog = ref<HTMLDialogElement>()
const likes = ref(props.exhibition.likes)
const submitting = ref(false)
const likeError = ref('')
const liked = ref(false)
const { updateLikes } = useExhibitionDialog()
watch(
  () => props.exhibition.id,
  () => {
    likes.value = props.exhibition.likes
    likeError.value = ''
    liked.value = false
  },
)
onMounted(() => dialog.value?.showModal())
onBeforeUnmount(() => dialog.value?.close())
async function like() {
  if (submitting.value) return
  submitting.value = true
  likeError.value = ''
  const requestedId = props.exhibition.id
  try {
    const result = await $fetch(`/api/exhibitions/${requestedId}/likes`, { method: 'POST' })
    // 通信中に同じ机の別作品を開いても、その作品に前のいいね数を上書きしない。
    if (props.exhibition.id === requestedId) {
      likes.value = result.likes
      liked.value = true
    }
    updateLikes(requestedId, result.likes)
    void refreshNuxtData('exhibitions')
  } catch {
    if (props.exhibition.id === requestedId)
      likeError.value = 'いいねを送信できませんでした。少し待ってからお試しください。'
  } finally {
    submitting.value = false
  }
}
function dismissBackdrop(event: MouseEvent) {
  if (event.target === dialog.value) emit('close')
}
</script>
<template>
  <dialog
    ref="dialog"
    class="exhibition-dialog"
    aria-labelledby="exhibition-title"
    @cancel.prevent="emit('close')"
    @click="dismissBackdrop"
  >
    <div class="detail-body">
      <div class="detail-heading">
        <div>
          <p class="eyebrow">
            EXHIBITION {{ exhibition.deskKey.replace('desk-', '').toUpperCase() }}
          </p>
          <h2 id="exhibition-title">{{ exhibition.title }}</h2>
        </div>
        <button
          class="icon-button close-detail"
          aria-label="作品詳細を閉じる"
          autofocus
          @click="emit('close')"
        >
          <img src="/figma/detail-icon-x.svg" width="22" height="22" alt="" />
        </button>
      </div>
      <div v-if="siblings.length > 1" class="work-switcher" aria-label="この机の作品">
        <button
          v-for="(item, index) in siblings"
          :key="item.id"
          :class="{ selected: item.id === exhibition.id }"
          :aria-pressed="item.id === exhibition.id"
          @click="emit('select', item)"
        >
          {{ index + 1 }}. {{ item.title }}
        </button>
      </div>
      <div class="detail-tags">
        <NuxtLink class="chip" :to="`/teams/${team?.id ?? exhibition.teamId}`"
          >{{ team?.name ?? '班紹介' }} ↗</NuxtLink
        >
      </div>
      <p class="description">{{ exhibition.description }}</p>
      <p class="detail-location">
        所属班 {{ team?.name ?? '情報未取得' }} ／ 展示場所
        {{ exhibition.deskKey.replace('desk-', '').toUpperCase() }}
      </p>
      <div v-if="teamError" class="inline-error" role="alert">
        <p>班の情報を取得できませんでした。</p>
        <button class="secondary-button" @click="emit('retryTeams')">班の情報を再読み込み</button>
      </div>
      <section class="creator-comment">
        <h3>制作者より</h3>
        <p>{{ exhibition.creatorComment }}</p>
      </section>
      <button class="primary-button like-button" :disabled="submitting" @click="like">
        <span aria-hidden="true">{{ liked ? '♥' : '♡' }}</span>
        {{ submitting ? '送信中…' : 'いいね！' }} <strong>{{ likes }}</strong>
      </button>
      <p class="like-feedback" aria-live="polite">
        {{ liked ? '応援ありがとうございます！' : '気に入った作品を、そっと応援しよう。' }}
      </p>
      <p v-if="likeError" class="inline-error" role="alert">{{ likeError }}</p>
    </div>
  </dialog>
</template>
<style scoped>
.exhibition-dialog {
  width: 342px;
  max-width: calc(100vw - 32px);
  max-height: calc(100dvh - 64px);
  margin: 80px auto auto;
  padding: 0;
  color: var(--ink);
  background: var(--glass);
  border: 1px solid var(--line);
  border-radius: 28px;
  box-shadow: 0 12px 60px #4b2d2229;
  overscroll-behavior: contain;
}
.exhibition-dialog::backdrop {
  background: #4b2d2245;
  backdrop-filter: blur(3px);
}
.detail-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.detail-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}
.detail-heading h2 {
  font-size: 22px;
  margin: 0;
  line-height: 1.5;
}
.close-detail {
  background: var(--paper);
  flex-shrink: 0;
}
.detail-tags {
  display: flex;
  gap: 8px;
}
.description {
  font-size: 13px;
  line-height: 1.8;
  white-space: pre-line;
}
.detail-location {
  font-size: 11px;
  color: var(--muted);
}
.creator-comment {
  background: var(--paper);
  padding: 12px;
  border-radius: 20px;
  border: 1px solid var(--line);
}
.creator-comment h3 {
  font-size: 10px;
  font-weight: 500;
  margin: 0 0 4px;
}
.creator-comment p {
  font-size: 12px;
  line-height: 1.7;
  white-space: pre-line;
}
.like-button {
  gap: 8px;
}
.like-feedback {
  color: var(--muted);
  font-size: 10px;
}
.inline-error {
  font-size: 12px;
  color: var(--error);
}
.work-switcher {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.work-switcher button {
  min-height: 36px;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 6px 9px;
  font-size: 10px;
  background: var(--white);
  color: var(--ink);
}
.work-switcher button.selected {
  background: var(--lavender);
  border-color: #b4a0da;
}
@media (max-height: 600px) {
  .exhibition-dialog {
    margin-top: 24px;
    max-height: calc(100dvh - 48px);
  }
}
.close-detail img {
  filter: var(--icon-filter);
}
</style>
