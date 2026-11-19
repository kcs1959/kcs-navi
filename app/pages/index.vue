<script setup lang="ts">
import { deskKeys, type ExhibitionsResponse, type TeamsResponse } from '~~/shared/types'
import { boothMapLocations } from '~~/shared/boothMap'

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

// 3D描画（WebGL利用不可時は全体図）の準備完了までローディングを維持する。
const mapRendered = ref(false)
const mapLoading = computed(() => status.value === 'pending' || !mapRendered.value)
const worksAvailable = computed(
  () => Boolean(data.value) && !error.value && status.value !== 'pending',
)
const worksAt = (key: string) =>
  !worksAvailable.value
    ? []
    : (data.value?.exhibitions.filter((exhibition) => exhibition.deskKey === key) ?? [])
const desks = computed(() =>
  deskKeys.map((key, index) => {
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
      title:
        works[0]?.title ?? boothMapLocations.find((location) => location.deskId === key)?.label,
      description: works[0]?.description ?? '',
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
      description="吹き出しをタップすると作品の詳細が表示されます。"
    />
    <CrowdCard
      :stats="stats"
      :failed="Boolean(statsError)"
      :loading="statsStatus === 'pending'"
      @retry="refreshStats()"
    />
    <section class="card booth-map" aria-label="展示マップ" :aria-busy="mapLoading">
      <div class="map-heading">
        <span class="chip lemon">三田キャンパス 院校舎 345A教室</span>
      </div>
      <div class="map-surface">
        <BoothMap3D :desks="desks" @select="selectDesk" @ready="mapRendered = true" />
        <Transition name="loading-fade">
          <LoadingIndicator v-if="mapLoading" overlay label="マップを準備しています" />
        </Transition>
      </div>
      <div class="map-footer">
        <NuxtLink to="/exhibitions">展示作品を見る <span aria-hidden="true">→</span></NuxtLink>
      </div>
    </section>
    <div v-if="error" class="error-card" role="alert">
      <p>展示情報を読み込めませんでした。</p>
      <button class="secondary-button" @click="refresh()">もう一度読み込む</button>
    </div>
    <p v-else-if="status !== 'pending' && !data?.exhibitions.length" class="data-notice">
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
.map-surface {
  position: relative;
  border-radius: 20px;
  height: clamp(500px, 65vw, 760px);
}
.map-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}
.map-footer a {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding-inline: 8px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 500;
}
.map-footer a:hover {
  color: var(--ink);
}
.loading-fade-leave-active {
  transition: opacity 0.3s;
}
.loading-fade-leave-to {
  opacity: 0;
}
.data-notice {
  font-size: 10px;
  color: var(--muted);
  text-align: center;
}
</style>
