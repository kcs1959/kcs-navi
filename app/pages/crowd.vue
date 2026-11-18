<script setup lang="ts">
import { crowdChartBuckets } from '../utils/crowdChart'

// 混雑度の算出ロジック（旧「推定値について」セクションの内容）:
// 直近20分のチェックイン数を推定滞在人数とし、混雑率 = 推定滞在人数 ÷ 定員40人 × 100% で算出する。
// 画面上の説明表示は絵文字と色による直感的な表示へ置き換えたため削除し、
// 算出根拠はこのコメントと server/services/checkins.ts の congestionFor に残す。

const { locale, t } = useI18n()
const displayLocale = computed(() => (locale.value === 'en' ? 'en-US' : 'ja-JP'))

useHead(() => ({ title: t('crowd.meta.title') }))
const { data, error, status, refresh } = useCrowdStats()
const selectedTab = ref<'hourly' | 'daily'>('hourly')
const chartTitle = computed(() =>
  t(selectedTab.value === 'hourly' ? 'crowd.chart.hourlyTitle' : 'crowd.chart.dailyTitle'),
)

function handleTabKey(event: KeyboardEvent) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  selectedTab.value =
    event.key === 'Home'
      ? 'hourly'
      : event.key === 'End'
        ? 'daily'
        : selectedTab.value === 'hourly'
          ? 'daily'
          : 'hourly'
  document.getElementById(`${selectedTab.value}-tab`)?.focus()
}

function formatDay(date: string) {
  // 日付だけの値は JST の正午として扱い、閲覧端末のタイムゾーンによる前日へのずれを防ぐ。
  return new Intl.DateTimeFormat(displayLocale.value, {
    timeZone: 'Asia/Tokyo',
    month: 'numeric',
    day: 'numeric',
  }).format(new Date(`${date}T12:00:00+09:00`))
}

function formatHour(hour: string) {
  return new Intl.DateTimeFormat(displayLocale.value, {
    timeZone: 'Asia/Tokyo',
    hour: 'numeric',
    hour12: false,
  }).format(new Date(hour))
}

const chartItems = computed(() => {
  if (!data.value) return []
  return crowdChartBuckets(data.value, selectedTab.value).map((item) => ({
    ...item,
    label: selectedTab.value === 'hourly' ? formatHour(item.key) : formatDay(item.key),
  }))
})
const maximum = computed(() => Math.max(1, ...chartItems.value.map((item) => item.count)))
const todayLabel = computed(() => {
  const date = data.value?.today.date
  if (!date) return ''
  return new Intl.DateTimeFormat(displayLocale.value, {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(`${date}T12:00:00+09:00`))
})
function formatNumber(value: number) {
  return value.toLocaleString(displayLocale.value)
}
</script>

<template>
  <div class="page-content stack crowd-page">
    <PageHeading eyebrow="LIVE AT KCS" :title="t('crowd.heading')" />
    <CrowdCard
      :stats="data"
      :linked="false"
      :failed="Boolean(error)"
      :loading="status === 'pending'"
      @retry="refresh()"
    />

    <div v-if="error" class="error-card" role="alert">
      <p>{{ t('crowd.loadError') }}</p>
      <button type="button" class="secondary-button" @click="refresh()">
        {{ t('crowd.reload') }}
      </button>
    </div>
    <p v-else-if="!data && status === 'pending'" class="text-muted" role="status">
      {{ t('crowd.loading') }}
    </p>
    <section
      v-if="data && !error"
      class="card attendance-card"
      aria-labelledby="attendance-heading"
    >
      <div class="attendance-heading">
        <h2 id="attendance-heading">{{ t('crowd.todayAttendance') }}</h2>
      </div>
      <p class="attendance-count">
        <strong>{{ formatNumber(data.today.count) }}</strong
        ><span>{{ t('crowd.totalPeople') }}</span>
      </p>

      <div
        class="chart-tabs"
        :class="{ 'is-daily': selectedTab === 'daily' }"
        role="tablist"
        :aria-label="t('crowd.chart.tabListLabel')"
      >
        <button
          id="hourly-tab"
          type="button"
          role="tab"
          :aria-selected="selectedTab === 'hourly'"
          :tabindex="selectedTab === 'hourly' ? 0 : -1"
          aria-controls="attendance-panel"
          :class="{ active: selectedTab === 'hourly' }"
          @click="selectedTab = 'hourly'"
          @keydown="handleTabKey"
        >
          {{ t('crowd.chart.hourlyTab') }}
        </button>
        <button
          id="daily-tab"
          type="button"
          role="tab"
          :aria-selected="selectedTab === 'daily'"
          :tabindex="selectedTab === 'daily' ? 0 : -1"
          aria-controls="attendance-panel"
          :class="{ active: selectedTab === 'daily' }"
          @click="selectedTab = 'daily'"
          @keydown="handleTabKey"
        >
          {{ t('crowd.chart.dailyTab') }}
        </button>
      </div>

      <div
        id="attendance-panel"
        class="attendance-panel"
        role="tabpanel"
        :aria-labelledby="selectedTab === 'hourly' ? 'hourly-tab' : 'daily-tab'"
        tabindex="0"
      >
        <Transition name="attendance-chart" mode="out-in">
          <div :key="selectedTab">
            <div class="chart-scroll" :aria-label="chartTitle">
              <ol
                class="bar-chart"
                :style="{ minWidth: `${Math.max(0, chartItems.length * 44)}px` }"
              >
                <li
                  v-for="(item, index) in chartItems"
                  :key="item.key"
                  class="chart-item"
                  :aria-label="
                    t('crowd.chart.itemLabel', {
                      label: item.label,
                      count: formatNumber(item.count),
                    })
                  "
                >
                  <div class="bar-track" aria-hidden="true">
                    <div
                      class="bar"
                      :class="{ latest: index === chartItems.length - 1 }"
                      :style="{
                        height: `calc(var(--chart-max-bar-height) * ${item.count / maximum})`,
                      }"
                    >
                      <span class="bar-value">{{ formatNumber(item.count) }}</span>
                    </div>
                  </div>
                  <span class="bar-label" aria-hidden="true">{{ item.label }}</span>
                </li>
              </ol>
            </div>
          </div>
        </Transition>
      </div>

      <p class="chart-caption">
        {{
          selectedTab === 'hourly'
            ? t('crowd.chart.todayCaption', { date: todayLabel })
            : t('crowd.chart.dailyCaption')
        }}
      </p>
    </section>
  </div>
</template>

<style scoped>
.crowd-page {
  gap: 12px;
}
.crowd-page :deep(.page-heading h1) {
  font-size: clamp(19px, 5.9vw, 28px);
  white-space: nowrap;
  letter-spacing: -0.03em;
}
.attendance-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
  padding: 16px;
}
.attendance-heading {
  display: flex;
  gap: 8px;
  align-items: center;
}
.attendance-heading h2 {
  margin: 0;
  font-size: 12px;
  font-weight: 400;
  color: var(--muted);
}
.attendance-count {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 0;
}
.attendance-count strong {
  font-size: 36px;
  line-height: 1.5;
}
.attendance-count span {
  font-size: 12px;
}
.chart-tabs {
  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
  background: var(--paper);
  border-radius: 12px;
}
.chart-tabs::before {
  content: '';
  position: absolute;
  z-index: -1;
  inset: 0 auto 0 0;
  width: calc((100% - 4px) / 2);
  border-radius: 12px;
  background: var(--peach);
  transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
}
.chart-tabs.is-daily::before {
  transform: translateX(calc(100% + 4px));
}
.chart-tabs button {
  min-height: 40px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: var(--ink);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.attendance-panel {
  --chart-plot-height: 180px;
  --chart-max-bar-height: 150px;
  min-height: calc(var(--chart-plot-height) + 28px);
}
.attendance-chart-enter-active {
  transition:
    opacity 180ms ease-out,
    transform 180ms ease-out;
}
.attendance-chart-leave-active {
  transition:
    opacity 100ms ease-in,
    transform 100ms ease-in;
}
.attendance-chart-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.attendance-chart-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
.chart-scroll {
  position: relative;
  overflow-x: auto;
  padding-top: 4px;
}
.bar-chart {
  position: relative;
  display: flex;
  justify-content: space-between;
  list-style: none;
  padding: 0;
  margin: 0;
  height: calc(var(--chart-plot-height) + 24px);
}
.bar-chart::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: var(--chart-plot-height);
  box-sizing: border-box;
  border-left: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  background: var(--paper);
  pointer-events: none;
}
.chart-item {
  position: relative;
  flex: 1;
  min-width: 44px;
  display: grid;
  grid-template-rows: var(--chart-plot-height) 24px;
  text-align: center;
}
.bar-track {
  display: flex;
  align-items: end;
  justify-content: center;
  padding: 0 8px 2px;
}
.bar {
  position: relative;
  min-height: 1px;
  width: 28px;
  max-width: 100%;
  background: var(--peach);
  border-radius: 6px 6px 0 0;
}
.bar.latest {
  background: var(--orange);
}
.bar-value {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: calc(100% + 3px);
  font-size: 10px;
  color: var(--muted);
  white-space: nowrap;
}
.bar-label {
  align-self: center;
  font-size: 10px;
  color: var(--muted);
  white-space: nowrap;
}
.chart-caption {
  margin: 0;
  font-size: 10px;
  color: var(--muted);
}
.estimate-note {
  display: grid;
  gap: 4px;
}
.estimate-note h2 {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
}
.estimate-note p {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
  line-height: 1.5;
}
</style>
