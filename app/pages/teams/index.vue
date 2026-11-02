<script setup lang="ts">
import type { ExhibitionsResponse, TeamsResponse } from '~~/shared/types'

useHead({ title: '班紹介' })
const { data, error, refresh } = await useFetch<TeamsResponse>('/api/teams', { key: 'teams' })
const { data: works } = await useFetch<ExhibitionsResponse>('/api/exhibitions', {
  key: 'exhibitions',
})
const countWorks = (teamId: number) =>
  works.value?.exhibitions.filter((work) => work.teamId === teamId).length ?? 0
</script>

<template>
  <div class="page-content stack teams-page">
    <PageHeading
      eyebrow="KCS TEAMS"
      title="班紹介"
      description="KCSの班活動について"
    />
    <div v-if="error" class="error-card" role="alert">
      <p>班の情報を読み込めませんでした。</p>
      <button type="button" class="secondary-button" @click="refresh()">再読み込み</button>
    </div>
    <NuxtLink
      v-for="team in data?.teams"
      :key="team.id"
      :to="`/teams/${team.id}`"
      class="card team-card"
      :class="`team-${team.key}`"
    >
      <div class="team-card-top">
        <span class="chip">{{ team.name }}</span>
        <span class="work-count">{{ countWorks(team.id) }} 作品 →</span>
      </div>
      <h2>{{ team.name }}</h2>
      <p>{{ team.description }}</p>
    </NuxtLink>
    <p v-if="data && !data.teams.length" class="card text-muted">班の情報は準備中です。</p>
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
  color: var(--kcs-muted, #7d5b49);
}
.work-count {
  font-size: 10px;
  color: var(--kcs-muted, #7d5b49);
}
.team-vr .chip {
  background: var(--kcs-lavender, #e5dcf9);
}
.team-game .chip {
  background: var(--kcs-mint, #d5e9d5);
}
.team-dtm .chip {
  background: var(--kcs-lemon, #ffe8a3);
}
</style>
