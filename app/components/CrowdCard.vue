<script setup lang="ts">
import type { CheckinStatsResponse, CongestionLevel } from '../../shared/types'

// 混雑度を一目で伝えるための絵文字。3段階の分岐はサーバー側の congestionFor と揃えている。
const levelEmoji: Record<CongestionLevel, string> = {
  relaxed: '😄',
  moderate: '🙂',
  busy: '😳',
}

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
const emoji = computed(() =>
  current.value ? levelEmoji[current.value.congestion.level] : '',
)
const updatedAt = computed(() =>
  current.value
    ? new Intl.DateTimeFormat(locale.value === 'en' ? 'en-US' : 'ja-JP', {
        timeZone: 'Asia/Tokyo',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(current.value.congestion.calculatedAt))
    : '',
)
// 混雑度ラベルは日本語をメッセージキーとしている（en.json で英訳を管理）。
const levelLabels: Record<CheckinStatsResponse['congestion']['level'], string> = {
  relaxed: 'ゆったり',
  moderate: 'やや混雑',
  busy: '混雑',
}
function congestionLevelLabel(level: CheckinStatsResponse['congestion']['level']) {
  return t(levelLabels[level])
}
</script>
<template>
  <section class="card crowd-card" :aria-busy="loading" :aria-label="$t('混雑状況')">
    <template v-if="!unavailable && current">
      <NuxtLink
        v-if="linked"
        class="crowd-card-link"
        to="/crowd"
        :aria-label="$t('来場状況を詳しく見る')"
      />
      <div class="status" :class="current.congestion.level">
        <span class="status-emoji" aria-hidden="true">{{ emoji }}</span>
        <div class="status-texts">
          <span class="status-label">{{ congestionLevelLabel(current.congestion.level) }}</span>
          <span class="status-rate">{{
            $t('混雑度 {rate}%', { rate: current.congestion.estimatedRate })
          }}</span>
        </div>
      </div>
      <div class="crowd-update">
        <time :datetime="current.congestion.calculatedAt">{{
          $t('{time} 更新', { time: updatedAt })
        }}（{{ $t('自動') }}）</time
        ><img v-if="linked" src="/figma/map-icon-chevron-right.svg" width="14" height="14" alt="" />
      </div>
      <span class="sr-only">{{
        $t('推定滞在人数 {visitors}人、推定混雑率 {rate}パーセント', {
          visitors: current.congestion.estimatedVisitors,
          rate: current.congestion.estimatedRate,
        })
      }}</span>
    </template>
    <template v-else>
      <div class="status neutral">
        <span class="status-emoji" aria-hidden="true">{{ loading ? '⏳' : '❔' }}</span>
        <div class="status-texts">
          <span class="status-label">{{
            $t(loading ? '読み込み中' : '情報未取得')
          }}</span>
          <span class="status-rate">{{ $t('混雑度') }}</span>
        </div>
      </div>
      <p class="unavailable-title">
        {{ $t(loading ? '混雑情報を確認しています' : '混雑情報を取得できません') }}
      </p>
      <button v-if="!loading" class="secondary-button" @click="$emit('retry')">
        {{ $t('もう一度読み込む') }}
      </button>
      <p class="micro text-muted">{{ $t('人数は未取得です。マップは利用できます。') }}</p>
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
/* 絵文字＋ラベル＋割合を1枚のパネルにまとめ、レベルごとの淡いグラデーションと
   ラベル文字色で「空き=緑系・普通=黄系・混み=赤系」の印象を伝える。 */
.status {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border-radius: 18px;
}
.status.relaxed {
  background: linear-gradient(135deg, #eafbf1, var(--white));
}
.status.moderate {
  background: linear-gradient(135deg, #fff7e0, var(--white));
}
.status.busy {
  background: linear-gradient(135deg, #ffe9e4, var(--white));
}
.status.neutral {
  background: var(--paper);
}
.status.relaxed .status-label {
  color: #2f8f5b;
}
.status.moderate .status-label {
  color: #b9790a;
}
.status.busy .status-label {
  color: #d1483f;
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
.micro {
  font-size: 10px;
}
.crowd-update img {
  filter: var(--icon-filter);
}
</style>
