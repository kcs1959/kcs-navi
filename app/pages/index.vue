<script setup lang="ts">
import { deskKeys, type ExhibitionsResponse, type TeamsResponse } from '~~/shared/types'

const { locale, t } = useI18n()

useHead(() => ({
  title: t('map.meta.title'),
  htmlAttrs: { lang: locale.value === 'en' ? 'en' : 'ja' },
}))

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

// 初回のクライアント描画が完了するまでローディングを維持する。
// マウント前はSSR側と同じ状態にし、ハイドレーションの不一致を防ぐ。
const mapRendered = ref(false)
onMounted(() => {
  mapRendered.value = true
})
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
          (status.value === 'pending'
            ? t('map.states.loading')
            : error.value
              ? t('map.states.unavailable')
              : t('map.states.unregistered'))),
      count,
      countLabel:
        count === null
          ? t(status.value === 'pending' ? 'map.states.loading' : 'map.states.notRetrieved')
          : t('map.workCount', { count }),
      titles: works.map((work) => work.title).join('、'),
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
      :title="$t('map.heading')"
      :description="$t('map.description')"
    />
    <CrowdCard
      :stats="stats"
      :failed="Boolean(statsError)"
      :loading="statsStatus === 'pending'"
      @retry="refreshStats()"
    />
    <section class="card booth-map" aria-labelledby="map-title" :aria-busy="mapLoading">
      <div class="map-heading">
        <h2 id="map-title">{{ $t('map.mapHeading') }}</h2>
        <span class="chip lemon">{{ $t('map.tapDesk') }}</span>
      </div>
      <div class="map-surface">
        <BoothMap :desks="desks" @select="selectDesk" />
        <Transition name="loading-fade">
          <LoadingIndicator v-if="mapLoading" overlay :label="$t('map.preparingMap')" />
        </Transition>
      </div>
    </section>
    <div v-if="error" class="error-card" role="alert">
      <p>{{ $t('map.loadError') }}</p>
      <button class="secondary-button" @click="refresh()">{{ $t('map.retry') }}</button>
    </div>
    <p v-else-if="status !== 'pending' && !data?.exhibitions.length" class="data-notice">
      {{ $t('map.empty') }}
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
