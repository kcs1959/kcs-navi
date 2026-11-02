<script setup lang="ts">
import type { ExhibitionsResponse, TeamsResponse } from '~~/shared/types'

useHead({ title: '展示作品' })

const route = useRoute()
const selectedTeam = ref(typeof route.query.team === 'string' ? route.query.team : '')
const search = ref('')
const { openExhibition } = useExhibitionDialog()
const {
  data: works,
  error: worksError,
  status,
  refresh: refreshWorks,
} = await useFetch<ExhibitionsResponse>('/api/exhibitions', { key: 'exhibitions' })
const {
  data: teamData,
  error: teamsError,
  refresh: refreshTeams,
} = await useFetch<TeamsResponse>('/api/teams', { key: 'teams' })
const teams = computed(() => teamData.value?.teams ?? [])
watch(
  () => route.query.team,
  (value) => {
    selectedTeam.value = typeof value === 'string' ? value : ''
  },
)
watch(
  [teams, selectedTeam],
  () => {
    const matchingTeam = teams.value.find((team) => team.key === selectedTeam.value)
    if (matchingTeam) selectedTeam.value = String(matchingTeam.id)
  },
  { immediate: true },
)
const filteredWorks = computed(() => {
  const keyword = search.value.trim().toLocaleLowerCase('ja')
  return (works.value?.exhibitions ?? []).filter((work) => {
    const team = teams.value.find((item) => item.id === work.teamId)
    return (
      !keyword || `${work.title} ${team?.name ?? ''}`.toLocaleLowerCase('ja').includes(keyword)
    )
  })
})

async function retry() {
  await Promise.all([refreshWorks(), refreshTeams()])
}

function clearFilters() {
  selectedTeam.value = ''
  search.value = ''
}
</script>

<template>
  <div class="page-content works-page stack">
    <PageHeading
      eyebrow="EXHIBITIONS"
      title="展示作品"
      description="KCSのメンバーが制作しました！"
    />

    <div v-if="worksError || teamsError" class="error-card" role="alert">
      <p>展示情報を読み込めませんでした。</p>
      <button class="secondary-button" type="button" @click="retry">再読み込み</button>
    </div>
    <p v-else-if="status === 'pending'" class="text-muted" role="status">
      展示作品を読み込んでいます…
    </p>
    <template v-else>
      <p class="result-count text-muted" role="status">{{ filteredWorks.length }} 件の作品</p>
      <ExhibitionCard
        v-for="exhibition in filteredWorks"
        :key="exhibition.id"
        :exhibition="exhibition"
        :team="teams.find((team) => team.id === exhibition.teamId)"
        @select="openExhibition(exhibition)"
      />
      <div v-if="!filteredWorks.length" class="card empty-state">
        <p>該当する作品が見つかりませんでした。</p>
        <button class="secondary-button" type="button" @click="clearFilters">絞り込みを解除</button>
      </div>
      <NuxtLink class="teams-link" to="/teams">つくった人たちを知る · 班紹介 →</NuxtLink>
    </template>
  </div>
</template>

<style scoped>
.works-page {
  gap: 16px;
}
.result-count {
  margin: -4px 0;
  font-size: 10px;
}
.empty-state {
  display: grid;
  gap: 12px;
  padding: 20px;
  font-size: 12px;
}
.empty-state p {
  margin: 0;
}
.teams-link {
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}
</style>
