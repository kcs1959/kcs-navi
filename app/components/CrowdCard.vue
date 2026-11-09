<script setup lang="ts">
import type { CheckinStatsResponse } from '../../shared/types'

const { locale, t } = useI18n()
const props = withDefaults(
  defineProps<{
    stats?: CheckinStatsResponse | null
    linked?: boolean
    loading?: boolean
    failed?: boolean
  }>(),
  { stats: null, linked: true, loading: false, failed: false },
)
defineEmits<{ retry: [] }>()
// 取得はページで一度だけ行う。同じキーをカードでも再取得するとSSR描画中に
// 基準時刻が変わり、HTMLとクライアントの初期データが食い違ってしまう。
const current = computed(() => props.stats)
// 再取得失敗時は、前回の人数を「いま」の値として表示しない。
const unavailable = computed(() => props.failed || !current.value)
const updatedAt = computed(() =>
  current.value
    ? new Intl.DateTimeFormat(locale.value === 'en' ? 'en-US' : 'ja-JP', {
        timeZone: 'Asia/Tokyo',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(current.value.congestion.calculatedAt))
    : '',
)
function congestionLevelLabel(level: CheckinStatsResponse['congestion']['level']) {
  return t('crowdCard.levels.' + level)
}
</script>
<template>
  <section class="card crowd-card" :aria-busy="loading" :aria-label="$t('crowdCard.ariaLabel')">
    <template v-if="!unavailable && current">
      <NuxtLink
        v-if="linked"
        class="crowd-card-link"
        to="/crowd"
        :aria-label="$t('crowdCard.detailsAriaLabel')"
      />
      <div class="crowd-heading">
        <span class="chip" :class="current.congestion.level">{{
          congestionLevelLabel(current.congestion.level)
        }}</span
        ><span class="text-muted">{{ $t('crowdCard.estimateLabel') }}</span>
      </div>
      <div class="occupancy">
        <strong>{{ current.congestion.estimatedVisitors }}</strong
        ><span>{{ $t('crowdCard.capacity', { count: current.congestion.capacity }) }}</span
        ><b>・ {{ current.congestion.estimatedRate }}%</b>
      </div>
      <div class="crowd-update">
        <time :datetime="current.congestion.calculatedAt">{{
          $t('crowdCard.updatedAt', { time: updatedAt })
        }}</time
        ><span>{{ $t('crowdCard.refreshInterval') }}</span
        ><img v-if="linked" src="/figma/map-icon-chevron-right.svg" width="14" height="14" alt="" />
      </div>
      <span class="sr-only">{{
        $t('crowdCard.summary', {
          visitors: current.congestion.estimatedVisitors,
          rate: current.congestion.estimatedRate,
        })
      }}</span>
    </template>
    <template v-else>
      <div class="crowd-heading">
        <span class="chip">{{
          $t(loading ? 'crowdCard.loadingChip' : 'crowdCard.unavailableChip')
        }}</span
        ><span class="text-muted">{{ $t('crowdCard.estimateLabel') }}</span>
      </div>
      <p class="unavailable-title">
        {{ $t(loading ? 'crowdCard.checking' : 'crowdCard.loadError') }}
      </p>
      <button v-if="!loading" class="secondary-button" @click="$emit('retry')">
        {{ $t('crowdCard.retry') }}
      </button>
      <p class="micro text-muted">{{ $t('crowdCard.unavailableNote') }}</p>
    </template>
  </section>
</template>
<style scoped>
.crowd-card {
  position: relative;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-radius: 20px;
}
.crowd-card-link {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  z-index: 1;
}
.crowd-card:has(a:hover) {
  border-color: var(--orange);
}
.crowd-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  flex-wrap: wrap;
}
.chip.relaxed {
  background: var(--mint);
}
.chip.moderate {
  background: var(--lemon);
}
.chip.busy {
  background: var(--peach);
}
.occupancy {
  display: flex;
  gap: 8px;
  align-items: baseline;
  font-size: 14px;
}
.occupancy strong {
  font-size: 28px;
  line-height: 1.5;
}
.crowd-update {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 10px;
  color: var(--muted);
}
.unavailable-title {
  font-size: 13px;
  margin: 8px 0;
}
.micro {
  font-size: 10px;
}
</style>
