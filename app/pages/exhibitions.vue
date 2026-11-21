<script setup lang="ts">
import type { ExhibitionsResponse, TeamsResponse } from '~~/shared/types'

useHead({ title: '展示作品' })

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
// 班情報の取得に失敗したときは古い班データを使わず、絞り込みを解除して全作品を表示する。
const teams = computed(() => (teamsError.value ? [] : (teamData.value?.teams ?? [])))
const exhibitions = computed(() => works.value?.exhibitions ?? [])

// 絞り込み状態はURLのクエリ (?team=班ID) に持たせ、再読み込みやリンク共有でも保持する。
const route = useRoute()
const router = useRouter()
const selectedTeamId = computed<number | null>({
  // ?team=1&team=2 のような重複指定は配列になるため、先頭の値を使う。
  get: () =>
    teams.value.find((team) => String(team.id) === [route.query.team].flat()[0])?.id ?? null,
  set: (teamId) => {
    router.replace({
      query: { ...route.query, team: teamId === null ? undefined : teamId },
      hash: route.hash,
    })
  },
})
const filterOptions = computed(() => [{ id: null, name: 'すべて' }, ...teams.value])
const filteredExhibitions = computed(() =>
  selectedTeamId.value === null
    ? exhibitions.value
    : exhibitions.value.filter((work) => work.teamId === selectedTeamId.value),
)
</script>

<template>
  <div class="page-content works-page stack">
    <PageHeading title="展示作品" />

    <div v-if="worksError" class="error-card" role="alert">
      <p>展示情報を読み込めませんでした。</p>
      <button class="secondary-button" type="button" @click="refreshWorks()">再読み込み</button>
    </div>
    <p v-else-if="status === 'pending'" class="text-muted" role="status">
      展示作品を読み込んでいます…
    </p>
    <template v-else>
      <div v-if="teamsError" class="error-card" role="alert">
        <p>班情報を読み込めませんでした。すべての作品を表示しています。</p>
        <button class="secondary-button" type="button" @click="refreshTeams()">
          班情報を再読み込み
        </button>
      </div>
      <div v-else-if="teams.length" class="team-filter" role="group" aria-label="班で絞り込む">
        <button
          v-for="option in filterOptions"
          :key="option.id ?? 'all'"
          class="chip team-filter-button"
          type="button"
          :aria-pressed="selectedTeamId === option.id"
          @click="selectedTeamId = option.id"
        >
          {{ option.name }}
        </button>
      </div>
      <p class="result-count text-muted" role="status">{{ filteredExhibitions.length }} 件の作品</p>
      <ExhibitionCard
        v-for="exhibition in filteredExhibitions"
        :key="exhibition.id"
        :exhibition="exhibition"
        show-likes
        :team="teams.find((team) => team.id === exhibition.teamId)"
        @select="openExhibition(exhibition)"
      />
      <div v-if="!exhibitions.length" class="card empty-state">
        <p>展示情報はまだ登録されていません。</p>
      </div>
      <div v-else-if="!filteredExhibitions.length" class="card empty-state">
        <p>この班の展示作品はまだありません。</p>
      </div>
      <NuxtLink class="teams-link" to="/teams">つくった人たちを知る →</NuxtLink>
    </template>
  </div>
</template>

<style scoped>
.works-page {
  gap: 16px;
}
.team-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.team-filter-button {
  min-height: 44px;
  border: 1px solid var(--line);
  font-size: 12px;
}
.team-filter-button[aria-pressed='true'] {
  background: var(--strong);
  border-color: var(--ink);
  font-weight: 700;
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
