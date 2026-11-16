<script setup lang="ts">
import type { ExhibitionsResponse, TeamsResponse } from '~~/shared/types'

useHead({ title: '班紹介' })
const { data, error, refresh } = await useFetch<TeamsResponse>('/api/teams', { key: 'teams' })
const { data: works, error: worksError } = await useFetch<ExhibitionsResponse>('/api/exhibitions', {
  key: 'exhibitions',
})
const countWorks = (teamId: number) =>
  !worksError.value && works.value
    ? works.value.exhibitions.filter((work) => work.teamId === teamId).length
    : null
</script>

<template>
  <div class="page-content stack teams-page">
    <PageHeading eyebrow="KCS TEAMS" title="班紹介" description="KCSの班活動について" />
    <div v-if="error" class="error-card" role="alert">
      <p>班の情報を読み込めませんでした。</p>
      <button type="button" class="secondary-button" @click="refresh()">再読み込み</button>
    </div>
    <NuxtLink
      v-for="team in data?.teams"
      :key="team.id"
      :to="`/teams/${team.id}`"
      class="card team-card"
    >
      <div class="team-card-top">
        <span class="chip">{{ team.name }}</span>
        <span class="work-count"
          >{{
            countWorks(team.id) === null ? '作品数未取得' : `${countWorks(team.id)} 作品`
          }}
          →</span
        >
      </div>
      <h2>{{ team.name }}</h2>
      <p>{{ team.description }}</p>
    </NuxtLink>
    <p v-if="data && !error && !data.teams.length" class="card text-muted">
      班の情報はまだ登録されていません。
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
