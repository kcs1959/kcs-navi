<script setup lang="ts">
useHead({ title: '来場者数・混雑状況' })
const { data, error, status, refresh } = useCrowdStats()
const selectedTab = ref<'hourly' | 'daily'>('hourly')
const chartTitle = computed(() =>
  selectedTab.value === 'hourly' ? '時間別のチェックイン数' : '日別のチェックイン数',
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
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'numeric',
    day: 'numeric',
  }).format(new Date(`${date}T12:00:00+09:00`))
}

function formatHour(hour: string) {
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    hour: 'numeric',
    hour12: false,
  }).format(new Date(hour))
}

// hourly は複数日を含むため、API が JST 形式で返す日付を当日に絞る。未記録の値は補わない。
const chartItems = computed(() =>
  selectedTab.value === 'hourly'
    ? (data.value?.hourly ?? [])
        .filter((item) => item.hour.startsWith(data.value?.today.date ?? 'no-date'))
        .map((item) => ({ key: item.hour, label: formatHour(item.hour), count: item.count }))
    : (data.value?.daily ?? []).map((item) => ({
        key: item.date,
        label: formatDay(item.date),
        count: item.count,
      })),
)
const maximum = computed(() => Math.max(1, ...chartItems.value.map((item) => item.count)))
const todayLabel = computed(() => {
  const date = data.value?.today.date
  if (!date) return ''
  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(`${date}T12:00:00+09:00`))
})
</script>

<template>
  <div class="page-content stack crowd-page">
    <PageHeading eyebrow="LIVE AT KCS" title="KCS @三田祭 へようこそ！" />
    <CrowdCard
      :stats="data"
      :linked="false"
      :failed="Boolean(error)"
      :loading="status === 'pending'"
      @retry="refresh()"
    />

    <div v-if="error" class="error-card" role="alert">
      <p>来場者数を取得できませんでした。</p>
      <button type="button" class="secondary-button" @click="refresh()">再読み込み</button>
    </div>
    <p v-else-if="!data && status === 'pending'" class="text-muted" role="status">
      来場者数を読み込んでいます…
    </p>
    <section
      v-if="data && !error"
      class="card attendance-card"
      aria-labelledby="attendance-heading"
    >
      <div class="attendance-heading">
        <h2 id="attendance-heading">今日の来場者数</h2>
        <span v-if="data.mode === 'demo'" class="chip demo-chip">サンプル</span>
      </div>
      <p class="attendance-count">
        <strong>{{ data.today.count.toLocaleString('ja-JP') }}</strong
        ><span>人（延べ）</span>
      </p>

      <div class="chart-tabs" role="tablist" aria-label="来場者数の集計単位">
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
          時間別
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
          日別
        </button>
      </div>

      <div
        id="attendance-panel"
        role="tabpanel"
        :aria-labelledby="selectedTab === 'hourly' ? 'hourly-tab' : 'daily-tab'"
        tabindex="0"
      >
        <div v-if="chartItems.length" class="chart-scroll" :aria-label="chartTitle">
          <ol class="bar-chart" :style="{ minWidth: `${Math.max(0, chartItems.length * 44)}px` }">
            <li
              v-for="(item, index) in chartItems"
              :key="item.key"
              class="chart-item"
              :aria-label="`${item.label}：${item.count}人`"
            >
              <div class="bar-track" aria-hidden="true">
                <div
                  class="bar"
                  :class="{ latest: index === chartItems.length - 1 }"
                  :style="{ height: `${(item.count / maximum) * 92}px` }"
                >
                  <span class="bar-value">{{ item.count }}</span>
                </div>
              </div>
              <span class="bar-label" aria-hidden="true">{{ item.label }}</span>
            </li>
          </ol>
        </div>
        <p v-else class="empty-chart">
          {{ selectedTab === 'hourly' ? '今日の' : '' }}チェックイン記録はまだありません。
        </p>
      </div>

      <p class="chart-caption">
        {{ selectedTab === 'hourly' ? `${todayLabel}（日本時間）` : '日別集計（日本時間）'
        }}<span v-if="data.mode === 'demo'">の表示例</span>
      </p>
    </section>

    <section class="estimate-note" aria-labelledby="estimate-heading">
      <h2 id="estimate-heading">推定値について</h2>
      <p>
        直近20分のチェックイン数を滞在人数として推定。<br />混雑率 = 推定人数 ÷ 定員40人 × 100%。<br />実際の人数とは異なる場合があります。
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
  color: var(--kcs-muted, #7d5b49);
}
.demo-chip {
  background: var(--kcs-paper, #fff6ea);
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
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
}
.chart-tabs button {
  min-height: 40px;
  border: none;
  border-radius: 12px;
  background: var(--kcs-paper, #fff6ea);
  color: var(--kcs-ink, #4b2d22);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.chart-tabs button.active {
  background: var(--kcs-peach, #ffd8bc);
}
.chart-scroll {
  overflow-x: auto;
  padding-top: 4px;
}
.bar-chart {
  display: flex;
  justify-content: space-between;
  list-style: none;
  padding: 0;
  margin: 0;
  height: 147px;
}
.chart-item {
  flex: 1;
  min-width: 44px;
  display: grid;
  grid-template-rows: 123px 24px;
  text-align: center;
}
.bar-track {
  display: flex;
  align-items: end;
  justify-content: center;
  padding: 0 8px 1px;
  border-bottom: 1px solid var(--kcs-line, #ead6c5);
}
.bar {
  position: relative;
  min-height: 1px;
  width: 28px;
  max-width: 100%;
  background: var(--kcs-peach, #ffd8bc);
  border-radius: 6px 6px 0 0;
}
.bar.latest {
  background: var(--kcs-orange, #ee8b4a);
}
.bar-value {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: calc(100% + 3px);
  font-size: 10px;
  color: var(--kcs-muted, #7d5b49);
  white-space: nowrap;
}
.bar-label {
  align-self: center;
  font-size: 10px;
  color: var(--kcs-muted, #7d5b49);
  white-space: nowrap;
}
.chart-caption {
  margin: 0;
  font-size: 10px;
  color: var(--kcs-muted, #7d5b49);
}
.empty-chart {
  min-height: 147px;
  display: grid;
  place-items: center;
  margin: 0;
  font-size: 12px;
  color: var(--kcs-muted, #7d5b49);
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
  color: var(--kcs-muted, #7d5b49);
  line-height: 1.5;
}
</style>
