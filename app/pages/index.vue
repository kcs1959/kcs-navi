<script setup lang="ts">
import { deskKeys, type ExhibitionsResponse, type TeamsResponse } from '~~/shared/types'

const { locale, t } = useI18n()

useHead(() => ({
  title: t('会場マップ'),
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
            ? t('読み込み中')
            : error.value
              ? t('情報未取得')
              : t('未登録'))),
      count,
      countLabel:
        count === null
          ? t(status.value === 'pending' ? '読み込み中' : '未取得')
          : t('{count}作品', { count }),
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
      :title="$t('KCS ブースマップ')"
      :description="$t('机をタップすると作品の詳細が表示されます。')"
    />
    <CrowdCard
      :stats="stats"
      :failed="Boolean(statsError)"
      :loading="statsStatus === 'pending'"
      @retry="refreshStats()"
    />
    <section class="card booth-map" aria-labelledby="map-title" :aria-busy="mapLoading">
      <div class="map-heading">
        <h2 id="map-title">{{ $t('展示マップ') }}</h2>
        <span class="chip lemon">{{ $t('机をタップ') }}</span>
      </div>
      <div class="map-surface">
        <BoothMap :desks="desks" @select="selectDesk" />
        <Transition name="loading-fade">
          <LoadingIndicator v-if="mapLoading" overlay :label="$t('マップを準備しています')" />
        </Transition>
      </div>
    </section>
    <div v-if="error" class="error-card" role="alert">
      <p>{{ $t('展示情報を読み込めませんでした。') }}</p>
      <button class="secondary-button" @click="refresh()">{{ $t('もう一度読み込む') }}</button>
    </div>
    <p v-else-if="status !== 'pending' && !data?.exhibitions.length" class="data-notice">
      {{ $t('展示情報はまだ登録されていません。') }}
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
