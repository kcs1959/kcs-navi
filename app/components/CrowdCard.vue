<script setup lang="ts">
import type { CheckinStatsResponse, CongestionLevel } from '../../shared/types'

// 混雑度を一目で伝えるための絵文字。3段階の分岐はサーバー側の congestionFor と揃えている。
const levelEmoji: Record<CongestionLevel, string> = {
  relaxed: '😄',
  moderate: '🙂',
  busy: '😳',
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
const emoji = computed(() => (current.value ? levelEmoji[current.value.congestion.level] : ''))
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
      <div class="status" :class="current.congestion.level">
        <span class="status-emoji" aria-hidden="true">{{ emoji }}</span>
        <div class="status-texts">
          <span class="status-label">{{ current.congestion.label }}</span>
          <span class="status-rate">混雑度 {{ current.congestion.estimatedRate }}%</span>
        </div>
      </div>
      <div class="crowd-update">
        <time :datetime="current.congestion.calculatedAt">{{ updatedAt }} 更新（自動）</time
        ><img v-if="linked" src="/figma/map-icon-chevron-right.svg" width="14" height="14" alt="" />
      </div>
      <span class="sr-only"
        >推定滞在人数 {{ current.congestion.estimatedVisitors }}人、推定混雑率
        {{ current.congestion.estimatedRate }}パーセント</span
      >
    </template>
    <template v-else>
      <div class="status neutral">
        <span class="status-emoji" aria-hidden="true">{{ loading ? '⏳' : '❔' }}</span>
        <div class="status-texts">
          <span class="status-label">{{ loading ? '読み込み中' : '未取得' }}</span>
          <span class="status-rate">混雑度</span>
        </div>
      </div>
      <p class="unavailable-title">
        {{ loading ? '混雑情報を確認しています' : '混雑情報を取得できません' }}
      </p>
      <button v-if="!loading" class="secondary-button" @click="$emit('retry')">
        もう一度読み込む
      </button>
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
/* 絵文字＋ラベル＋割合を1枚のパネルにまとめ、レベルごとのグラデーションと
   ラベル文字色で「空き=緑系・普通=黄系・混み=赤系」の印象を伝える。 */
.status {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border-radius: 18px;
  background: linear-gradient(135deg, var(--status-tint), var(--white));
}
.status.relaxed {
  --status-tint: #eafbf1;
  --status-label-color: #2f8f5b;
}
.status.moderate {
  --status-tint: #fff7e0;
  --status-label-color: #b9790a;
}
.status.busy {
  --status-tint: #ffe9e4;
  --status-label-color: #d1483f;
}
.status.neutral {
  background: var(--paper);
}
html[data-theme='dark'] .status.relaxed {
  --status-tint: #20392d;
  --status-label-color: #8ee0b1;
}
html[data-theme='dark'] .status.moderate {
  --status-tint: #44351d;
  --status-label-color: #ffd783;
}
html[data-theme='dark'] .status.busy {
  --status-tint: #482c29;
  --status-label-color: #ffaaa0;
}
.status-emoji {
  font-size: 38px;
  line-height: 1;
  flex-shrink: 0;
}
.status-texts {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.status-label {
  color: var(--status-label-color, inherit);
  font-size: 19px;
  font-weight: 800;
  line-height: 1.3;
}
.status-rate {
  font-size: 12px;
  color: var(--muted);
  font-weight: 500;
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
.crowd-update img {
  filter: var(--icon-filter);
}
</style>
