<script setup lang="ts">
import type { ExhibitionsResponse, TeamsResponse } from '~~/shared/types'

const { locale, t } = useI18n()

useHead(() => ({
  title: t('exhibitions.meta.title'),
  htmlAttrs: { lang: locale.value === 'en' ? 'en' : 'ja' },
}))

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
const exhibitions = computed(() => works.value?.exhibitions ?? [])

async function retry() {
  await Promise.all([refreshWorks(), refreshTeams()])
}
</script>

<template>
  <div class="page-content works-page stack">
    <PageHeading
      eyebrow="EXHIBITIONS"
      :title="$t('exhibitions.heading')"
      :description="$t('exhibitions.description')"
    />

    <div v-if="worksError || teamsError" class="error-card" role="alert">
      <p>{{ $t('exhibitions.loadError') }}</p>
      <button class="secondary-button" type="button" @click="retry">
        {{ $t('exhibitions.reload') }}
      </button>
    </div>
    <p v-else-if="status === 'pending'" class="text-muted" role="status">
      {{ $t('exhibitions.loading') }}
    </p>
    <template v-else>
      <p class="result-count text-muted" role="status">
        {{ $t('exhibitions.resultCount', { count: exhibitions.length }) }}
      </p>
      <ExhibitionCard
        v-for="exhibition in exhibitions"
        :key="exhibition.id"
        :exhibition="exhibition"
        :team="teams.find((team) => team.id === exhibition.teamId)"
        @select="openExhibition(exhibition)"
      />
      <div v-if="!exhibitions.length" class="card empty-state">
        <p>{{ $t('exhibitions.empty') }}</p>
      </div>
      <NuxtLink class="teams-link" to="/teams">{{ $t('exhibitions.teamsLink') }}</NuxtLink>
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
