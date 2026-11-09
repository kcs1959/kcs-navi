<script setup lang="ts">
import { LIKE_LIMIT, type Exhibition, type Team } from '../../shared/types'
import { likeStorageKey } from '../composables/useLocalLikes'
const props = defineProps<{
  exhibition: Exhibition
  team?: Team
  teamError?: boolean
  siblings: Exhibition[]
}>()
const emit = defineEmits<{ close: []; select: [exhibition: Exhibition]; retryTeams: [] }>()
const dialog = ref<HTMLDialogElement>()
const { counts, totals, pending, storageAvailable, syncCount, sendLike } = useLocalLikes()
const likes = computed(() =>
  Math.max(props.exhibition.likes, totals.value[props.exhibition.id] ?? 0),
)
const myLikes = computed(() => counts.value[props.exhibition.id] ?? 0)
const submitting = computed(() => Boolean(pending.value[props.exhibition.id]))
const ready = ref(false)
const atLimit = computed(() => myLikes.value >= LIKE_LIMIT)
const likeError = ref('')
const { updateLikes } = useExhibitionDialog()
let viewVersion = 0
function onStorage(event: StorageEvent) {
  if (event.key === null || event.key === likeStorageKey(props.exhibition.id))
    syncCount(props.exhibition.id)
}
onMounted(() => {
  dialog.value?.showModal()
  watch(
    () => props.exhibition.id,
    (id) => {
      viewVersion++
      syncCount(id)
      likeError.value = ''
      ready.value = true
    },
    { immediate: true },
  )
  window.addEventListener('storage', onStorage)
})
onBeforeUnmount(() => {
  viewVersion++
  window.removeEventListener('storage', onStorage)
  dialog.value?.close()
})
async function like() {
  if (!ready.value || submitting.value || atLimit.value) return
  likeError.value = ''
  const requestedId = props.exhibition.id
  const version = viewVersion
  try {
    const result = await sendLike(requestedId)
    if (!result) return
    // A completed request belongs to its original work, including after closing the dialog.
    updateLikes(requestedId, result.likes)
    void refreshNuxtData('exhibitions')
  } catch {
    if (version === viewVersion)
      likeError.value = 'いいねを送信できませんでした。もう一度試してください。'
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
        <p v-if="exhibition.creatorComment.trim()">{{ exhibition.creatorComment }}</p>
        <p v-else>コメントはありません。</p>
      </section>
      <section class="like-area" aria-label="作品を応援">
        <p class="like-message">{{ myLikes > 0 ? 'ありがとう！' : 'いいね！で応援しよう' }}</p>
        <button
          class="like-button"
          :class="{ 'is-complete': atLimit }"
          :disabled="!ready || submitting || atLimit"
          :aria-busy="submitting"
          :aria-label="
            atLimit
              ? 'この作品を10回応援しました'
              : `この作品にいいね（${myLikes} / ${LIKE_LIMIT}回）`
          "
          @click="like"
        >
          <svg class="like-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
            <path
              d="m12 13 5-8c.7-1.1 2.5-.6 2.5.7V12H25a3 3 0 0 1 2.9 3.8l-2.5 9a3 3 0 0 1-2.9 2.2H12V13Z"
            />
            <rect x="4" y="13" width="6" height="14" rx="1.5" />
          </svg>
          <span class="like-personal" aria-hidden="true">{{
            ready ? `${myLikes} / ${LIKE_LIMIT}` : '…'
          }}</span>
        </button>
        <p class="like-total">
          <strong>{{ likes.toLocaleString('ja-JP') }}</strong
          ><span>みんなのいいね</span>
        </p>
        <p class="like-feedback" aria-live="polite">
          {{
            submitting
              ? '送信中…'
              : atLimit
                ? '10回の応援、ありがとうございます！'
                : '1作品につき10回までタップできます'
          }}
          <span class="sr-only">あなたのいいね {{ myLikes }} / {{ LIKE_LIMIT }} 回。</span>
        </p>
      </section>
      <p v-if="!storageAvailable" class="like-feedback" role="status">
        このブラウザでは回数を保存できません。再読み込みすると回数がリセットされます。
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
.exhibition-dialog[open] {
  animation: exhibition-pop-in 0.2s ease-out;
}
@keyframes exhibition-pop-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
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
.like-area {
  --like-accent: #b94b25;
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 12px 0 4px;
  text-align: center;
}
.like-message {
  min-height: 20px;
  color: var(--muted);
  font-size: 13px;
}
.like-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 112px;
  height: 112px;
  padding: 14px;
  border: 2px solid var(--white);
  border-radius: 50%;
  color: white;
  background: var(--like-accent);
  box-shadow: 0 4px 12px #b94b2526;
  touch-action: manipulation;
  transition:
    transform 120ms ease,
    box-shadow 120ms ease;
}
.like-button:not(:disabled):active {
  transform: scale(0.94);
  box-shadow: 0 1px 4px #b94b2526;
}
.like-button:disabled {
  cursor: default;
}
.like-button.is-complete {
  box-shadow: none;
}
.like-icon {
  width: 48px;
  height: 48px;
  fill: currentColor;
}
.like-personal {
  font-size: 12px;
  line-height: 1.5;
  font-variant-numeric: tabular-nums;
}
.like-total {
  display: grid;
  gap: 2px;
}
.like-total strong {
  color: var(--like-accent);
  font-size: 20px;
  font-variant-numeric: tabular-nums;
}
.like-total span {
  color: var(--muted);
  font-size: 10px;
}
.like-feedback {
  color: var(--muted);
  font-size: 10px;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
@media (prefers-reduced-motion: reduce) {
  .like-button {
    transition: none;
  }
  .like-button:not(:disabled):active {
    transform: none;
  }
}
.inline-error {
  font-size: 12px;
  color: #a43d27;
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
  background: white;
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
</style>
