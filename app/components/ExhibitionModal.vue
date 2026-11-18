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
const { t } = useI18n()
const dialog = ref<HTMLDialogElement>()
const { counts, totals, pending, storageAvailable, syncCount, sendLike } = useLocalLikes()
const online = ref(true)
function updateOnlineStatus() {
  online.value = navigator.onLine
}
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
  updateOnlineStatus()
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
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
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
  window.removeEventListener('storage', onStorage)
  dialog.value?.close()
})
async function like() {
  if (!ready.value || submitting.value || atLimit.value || !online.value) return
  likeError.value = ''
  const requestedId = props.exhibition.id
  const version = viewVersion
  try {
    const result = await sendLike(requestedId)
    if (!result) return
    // A completed request belongs to its original work, including after closing the dialog.
    updateLikes(requestedId, result.likes)
  } catch {
    if (version === viewVersion) likeError.value = 'exhibitionModal.like.sendError'
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
          :aria-label="t('exhibitionModal.closeAriaLabel')"
          autofocus
          @click="emit('close')"
        >
          <img src="/figma/detail-icon-x.svg" width="22" height="22" alt="" />
        </button>
      </div>
      <div
        v-if="siblings.length > 1"
        class="work-switcher"
        :aria-label="t('exhibitionModal.worksAtDeskAriaLabel')"
      >
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
          >{{ team?.name ?? t('exhibitionModal.fallbackTeam') }} ↗</NuxtLink
        >
      </div>
      <p class="description">{{ exhibition.description }}</p>
      <p class="detail-location">
        {{
          t('exhibitionModal.location', {
            team: team?.name ?? t('exhibitionModal.unavailable'),
            desk: exhibition.deskKey.replace('desk-', '').toUpperCase(),
          })
        }}
      </p>
      <div v-if="teamError" class="inline-error" role="alert">
        <p>{{ t('exhibitionModal.teamLoadError') }}</p>
        <button class="secondary-button" @click="emit('retryTeams')">
          {{ t('exhibitionModal.retryTeam') }}
        </button>
      </div>
      <section class="creator-comment">
        <h3>{{ t('exhibitionModal.creatorHeading') }}</h3>
        <p v-if="exhibition.creatorComment.trim()">{{ exhibition.creatorComment }}</p>
        <p v-else>{{ t('exhibitionModal.noCreatorComment') }}</p>
      </section>
      <section class="like-area" :aria-label="t('exhibitionModal.like.areaAriaLabel')">
        <p class="like-message">
          {{ t(myLikes > 0 ? 'exhibitionModal.like.thankYou' : 'exhibitionModal.like.prompt') }}
        </p>
        <button
          class="like-button"
          :class="{ 'is-complete': atLimit, 'is-offline': !online }"
          :disabled="!ready || submitting || atLimit || !online"
          :aria-busy="submitting"
          :aria-label="
            atLimit
              ? t('exhibitionModal.like.limitAriaLabel', { limit: LIKE_LIMIT })
              : t('exhibitionModal.like.buttonAriaLabel', {
                  count: myLikes,
                  limit: LIKE_LIMIT,
                })
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
          ><span>{{ t('exhibitionModal.like.everyoneLikes') }}</span>
        </p>
        <p class="like-feedback" aria-live="polite">
          {{
            submitting
              ? t('exhibitionModal.like.sending')
              : atLimit
                ? t('exhibitionModal.like.complete', { limit: LIKE_LIMIT })
                : t('exhibitionModal.like.instruction', { limit: LIKE_LIMIT })
          }}
          <span class="sr-only">{{
            t('exhibitionModal.like.personalSummary', {
              count: myLikes,
              limit: LIKE_LIMIT,
            })
          }}</span>
        </p>
      </section>
      <p v-if="!online" class="like-feedback" role="status">
        {{ t('exhibitionModal.like.offline') }}
      </p>
      <p v-if="!storageAvailable" class="like-feedback" role="status">
        {{ t('exhibitionModal.like.storageUnavailable') }}
      </p>
      <p v-if="likeError" class="inline-error" role="alert">{{ t(likeError) }}</p>
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
  box-shadow: 0 12px 60px var(--dialog-shadow);
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
  background: var(--dialog-backdrop);
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
  color: var(--on-like-accent);
  background: var(--like-accent);
  box-shadow: 0 4px 12px var(--like-shadow);
  touch-action: manipulation;
  transition:
    transform 120ms ease,
    box-shadow 120ms ease;
}
.like-button:not(:disabled):active {
  transform: scale(0.94);
  box-shadow: 0 1px 4px var(--like-shadow);
}
.like-button:disabled {
  cursor: default;
}
.like-button.is-complete {
  box-shadow: none;
}
.like-button.is-offline {
  color: var(--muted);
  background: var(--line);
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
.detail-location,
.creator-comment p,
.like-message,
.like-total span,
.like-feedback,
.inline-error {
  overflow-wrap: anywhere;
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
  border-color: var(--selected-work-border);
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
