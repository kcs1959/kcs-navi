<script setup lang="ts">
import type { CheckinStatsResponse, CongestionLevel } from '../../shared/types'

// 混雑度を一目で伝えるための絵文字。3段階の分岐はサーバー側の congestionFor と揃えている。
const levelEmoji: Record<CongestionLevel, string> = {
  relaxed: '😄',
  moderate: '🙂',
  busy: '😥',
}

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
const emoji = computed(() =>
  current.value ? levelEmoji[current.value.congestion.level] : '',
)
const updatedAt = computed(() =>
  current.value
    ? new Intl.DateTimeFormat('ja-JP', {
        timeZone: 'Asia/Tokyo',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(current.value.congestion.calculatedAt))
    : '',
)
</script>
<template>
  <section class="card crowd-card" :aria-busy="loading" aria-label="混雑状況">
    <template v-if="!unavailable && current">
      <NuxtLink
        v-if="linked"
        class="crowd-card-link"
        to="/crowd"
        aria-label="来場状況を詳しく見る"
      />
      <div class="crowd-heading">
        <span class="chip" :class="current.congestion.level">{{ current.congestion.label }}</span
        ><span class="text-muted">混雑目安</span>
      </div>
      <div class="occupancy" :class="current.congestion.level">
        <span class="occupancy-emoji" aria-hidden="true">{{ emoji }}</span>
        <strong>{{ current.congestion.estimatedRate }}%</strong>
      </div>
      <div class="crowd-update">
        <time :datetime="current.congestion.calculatedAt">{{ updatedAt }} 更新</time
        ><span>30秒ごとに更新</span
        ><img v-if="linked" src="/figma/map-icon-chevron-right.svg" width="14" height="14" alt="" />
      </div>
      <span class="sr-only"
        >推定滞在人数 {{ current.congestion.estimatedVisitors }}人、推定混雑率
        {{ current.congestion.estimatedRate }}パーセント</span
      >
    </template>
    <template v-else>
      <div class="crowd-heading">
        <span class="chip">{{ loading ? '読み込み中' : '情報未取得' }}</span
        ><span class="text-muted">混雑目安</span>
      </div>
      <p class="unavailable-title">
        {{ loading ? '混雑情報を確認しています' : '混雑情報を取得できません' }}
      </p>
      <button v-if="!loading" class="secondary-button" @click="$emit('retry')">
        もう一度読み込む
      </button>
      <p class="micro text-muted">人数は未取得です。マップは利用できます。</p>
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
  align-items: center;
  padding: 4px 12px;
  margin: 2px 0;
  width: fit-content;
  border-radius: 16px;
}
/* 背景色は混雑チップ（.chip.relaxed等）と揃え、空き=緑系・普通=黄系・混み=赤系の印象にする。 */
.occupancy.relaxed {
  background: var(--mint);
}
.occupancy.moderate {
  background: var(--lemon);
}
.occupancy.busy {
  background: var(--peach);
}
.occupancy-emoji {
  font-size: 32px;
  line-height: 1;
}
.occupancy strong {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
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
.crowd-update img {
  filter: var(--icon-filter);
}
</style>
