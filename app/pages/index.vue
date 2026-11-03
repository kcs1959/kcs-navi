<script setup lang="ts">
import type { ExhibitionsResponse, TeamsResponse } from '~~/shared/types'

useHead({ title: '会場マップ' })
const { data, error, status, refresh } = await useFetch<ExhibitionsResponse>('/api/exhibitions', {
  key: 'exhibitions',
})
const { data: teamData } = await useFetch<TeamsResponse>('/api/teams', { key: 'teams' })
const { openExhibition } = useExhibitionDialog()
const {
  data: stats,
  error: statsError,
  status: statsStatus,
  refresh: refreshStats,
} = useCrowdStats()

// TODO: 地図表示ロジック要検討（3D?）
// deskKeyはDBの作品に対応する固定キー（仮）
const deskPositions = ['desk-a', 'desk-b', 'desk-c']
const worksAvailable = computed(
  () => Boolean(data.value) && !error.value && status.value !== 'pending',
)
const worksAt = (key: string) =>
  !worksAvailable.value
    ? []
    : (data.value?.exhibitions.filter((exhibition) => exhibition.deskKey === key) ?? [])
const desks = computed(() =>
  deskPositions.map((key, index) => {
    const works = worksAt(key)
    const teams =
      teamData.value?.teams.filter((team) => works.some((work) => work.teamId === team.id)) ?? []
    const teamNames = [...new Set(teams.map((team) => team.name))]
    // 取得前・取得失敗の件数を0と扱わず、実際に空の机と区別する。
    const count = worksAvailable.value ? works.length : null
    return {
      key,
      number: String(index + 1).padStart(2, '0'),
      letter: key.replace('desk-', '').toUpperCase(),
      label: teamNames.length
        ? teamNames.join('・')
        : (works[0]?.title ??
          (status.value === 'pending' ? '読み込み中' : error.value ? '情報未取得' : '未登録')),
      count,
      countLabel:
        count === null ? (status.value === 'pending' ? '読み込み中' : '未取得') : `${count}作品`,
      titles: works.map((work) => work.title).join('、'),
      class: `desk-position-${index + 1}`,
    }
  }),
)
function selectDesk(key: string) {
  const works = worksAt(key)
  if (works[0]) openExhibition(works[0], works)
}
</script>
<template>
  <div class="page-content map-page">
    <PageHeading
      eyebrow="EXPLORE KCS"
      title="KCS ブースマップ"
      description="机をタップして、作品を見てみよう。"
    />
    <CrowdCard
      :stats="stats"
      :failed="Boolean(statsError)"
      :loading="statsStatus === 'pending'"
      @retry="refreshStats()"
    />
    <section class="card booth-map" aria-labelledby="map-title" :aria-busy="status === 'pending'">
      <div class="map-heading">
        <h2 id="map-title">展示マップ</h2>
        <span class="chip lemon">机をタップ</span>
      </div>
      <div class="room">
        <span class="entrance">入口 ↓</span><span class="exit">↑ 出口</span>
        <button
          v-for="desk in desks"
          :key="desk.key"
          class="desk"
          :class="desk.class"
          :disabled="!desk.count"
          :aria-label="`${desk.label}、展示机${desk.letter}、${desk.countLabel}${desk.titles ? `：${desk.titles}の詳細を見る` : ''}`"
          @click="selectDesk(desk.key)"
        >
          <span class="desk-label">{{ desk.label }}</span>
          <span class="chip desk-count">{{ desk.number }} · {{ desk.countLabel }}</span>
        </button>
      </div>
    </section>
    <div v-if="error" class="error-card" role="alert">
      <p>展示情報を読み込めませんでした。</p>
      <button class="secondary-button" @click="refresh()">もう一度読み込む</button>
    </div>
    <p v-else-if="status === 'pending'" class="data-notice" role="status">
      展示情報を読み込んでいます…
    </p>
    <p v-else-if="!data?.exhibitions.length" class="data-notice">
      展示情報はまだ登録されていません。
    </p>
  </div>
</template>
<style scoped>
.map-page {
  position: relative;
}
.booth-map {
  position: relative;
  padding: 16px 15px 8px;
  border-radius: 28px;
}
.map-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 2px 16px;
}
.map-heading h2 {
  font-size: 14px;
  margin: 0;
}
.lemon {
  background: var(--lemon);
}
.room {
  position: relative;
  height: 315px;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 20px;
}
.entrance,
.exit {
  position: absolute;
  top: 7px;
  font-size: 12px;
}
.entrance {
  left: 17px;
}
.exit {
  right: 26px;
}
.desk {
  position: absolute;
  background: var(--white);
  color: var(--ink);
  border: 1px solid var(--line);
  border-radius: 12px;
  /* DBの長い班名が2行になっても、件数とともに固定サイズの机内に収める。 */
  padding: 8px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  transition:
    transform 0.15s,
    box-shadow 0.15s;
}
.desk-position-1 {
  left: 5.5%;
  top: 79px;
  width: 34.2%;
  height: 116px;
  box-shadow: 0 7px var(--lavender);
}
.desk-position-2 {
  right: 5%;
  top: 49px;
  width: 34.2%;
  height: 116px;
  box-shadow: 0 7px var(--mint);
}
.desk-position-3 {
  left: 28%;
  top: 221px;
  width: 44.5%;
  height: 60px;
  padding: 2px 4px;
  gap: 2px;
  box-shadow: 0 7px var(--lemon);
}
.desk-position-1 .desk-count {
  background: var(--lavender);
}
.desk-position-2 .desk-count {
  background: var(--mint);
}
.desk:hover:not(:disabled) {
  transform: translateY(-3px);
  border-color: var(--orange);
}
.desk:active:not(:disabled) {
  transform: translateY(3px);
}
.desk:disabled {
  opacity: 0.5;
  cursor: default;
}
.desk-label {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-width: 100%;
  line-height: 1.4;
  overflow-wrap: anywhere;
}
.desk-position-3 .desk-label {
  -webkit-line-clamp: 1;
}
.map-caption {
  color: var(--muted);
  font-size: 10px;
  margin: 0 4px;
  line-height: 1.5;
}
.data-notice {
  font-size: 10px;
  color: var(--muted);
  text-align: center;
}
</style>
