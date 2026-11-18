<script setup lang="ts">
import type { ExhibitionsResponse, TeamsResponse } from '~~/shared/types'

const { locale, t } = useI18n()

useHead(() => ({
  title: t('teams.meta.title'),
  htmlAttrs: { lang: locale.value === 'en' ? 'en' : 'ja' },
}))

const { data, error, refresh } = await useFetch<TeamsResponse>('/api/teams', { key: 'teams' })
const { data: works, error: worksError } = await useFetch<ExhibitionsResponse>('/api/exhibitions', {
  key: 'exhibitions',
})
const countWorks = (teamId: number) =>
  !worksError.value && works.value
    ? works.value.exhibitions.filter((work) => work.teamId === teamId).length
    : null
function workCountLabel(teamId: number) {
  const count = countWorks(teamId)
  return count === null ? t('teams.workCountUnavailable') : t('teams.workCount', { count })
}
</script>

<template>
  <div class="page-content stack teams-page">
    <PageHeading
      eyebrow="KCS TEAMS"
      :title="t('teams.heading')"
      :description="t('teams.description')"
    />
    <div v-if="error" class="error-card" role="alert">
      <p>{{ t('teams.loadError') }}</p>
      <button type="button" class="secondary-button" @click="refresh()">
        {{ t('teams.reload') }}
      </button>
    </div>
    <NuxtLink
      v-for="team in data?.teams"
      :key="team.id"
      :to="`/teams/${team.id}`"
      class="card team-card"
    >
      <div class="team-card-top">
        <span class="chip">{{ team.name }}</span>
        <span class="work-count">{{ workCountLabel(team.id) }} →</span>
      </div>
      <h2>{{ team.name }}</h2>
      <p>{{ team.description }}</p>
    </NuxtLink>
    <p v-if="data && !error && !data.teams.length" class="card text-muted">
      {{ t('teams.empty') }}
    </p>
  </div>
</template>

<style scoped>
.teams-page {
  gap: 16px;
}
.team-card {
  display: grid;
  gap: 12px;
  padding: 20px;
  text-decoration: none;
}
.team-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.team-card h2 {
  margin: 0;
  font-size: 18px;
  line-height: 1.5;
}
.team-card p {
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  color: var(--muted);
}
.work-count {
  font-size: 10px;
  color: var(--muted);
}
</style>
