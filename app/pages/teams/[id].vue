<script setup lang="ts">
import type { ExhibitionsResponse, TeamsResponse } from '~~/shared/types'

const route = useRoute()
const { locale, t } = useI18n()
const { data, error, refresh } = await useFetch<TeamsResponse>('/api/teams', { key: 'teams' })
const {
  data: works,
  error: worksError,
  refresh: refreshWorks,
} = await useFetch<ExhibitionsResponse>('/api/exhibitions', { key: 'exhibitions' })
const team = computed(() => {
  // サイト内リンクのIDを優先し、数字のkeyを持つ別の班が同じURLに割り込むのを防ぐ。
  const teams = data.value?.teams
  return (
    teams?.find((item) => String(item.id) === route.params.id) ??
    teams?.find((item) => item.key === route.params.id)
  )
})
const teamWorks = computed(
  () => works.value?.exhibitions.filter((work) => work.teamId === team.value?.id) ?? [],
)
const { openExhibition } = useExhibitionDialog()

useHead(() => ({
  title: team.value?.name ?? t('班紹介'),
  htmlAttrs: { lang: locale.value === 'en' ? 'en' : 'ja' },
}))
</script>

<template>
  <div class="page-content stack team-page">
    <div class="team-heading">
      <NuxtLink to="/teams" class="back-button" :aria-label="$t('班一覧に戻る')">
        <img src="/figma/team-icon-arrow-left.svg" alt="" width="22" height="22" />
      </NuxtLink>
      <PageHeading eyebrow="MEET THE TEAM" :title="team?.name ?? $t('班紹介')" />
    </div>
    <div v-if="error" class="error-card" role="alert">
      <p>{{ $t('班の情報を読み込めませんでした。') }}</p>
      <button class="secondary-button" type="button" @click="refresh()">
        {{ $t('再読み込み') }}
      </button>
    </div>
    <template v-else-if="team">
      <section class="card team-about">
        <p>{{ team.description }}</p>
      </section>
      <h2 class="section-heading">
        {{ $t('この班の作品') }}
        <span v-if="works && !worksError">{{ teamWorks.length }}</span>
      </h2>
      <div v-if="worksError" class="error-card" role="alert">
        <p>{{ $t('作品を読み込めませんでした。') }}</p>
        <button class="secondary-button" type="button" @click="refreshWorks()">
          {{ $t('再読み込み') }}
        </button>
      </div>
      <ExhibitionCard
        v-for="exhibition in teamWorks"
        :key="exhibition.id"
        :exhibition="exhibition"
        :team="team"
        :show-description="false"
        @select="openExhibition(exhibition)"
      />
      <p v-if="works && !worksError && !teamWorks.length" class="card text-muted">
        {{ $t('この班の作品はまだ登録されていません。') }}
      </p>
    </template>
    <div v-else-if="data" class="card missing-team">
      <p>{{ $t('この班は見つかりませんでした。') }}</p>
      <NuxtLink class="secondary-button" to="/teams">{{ $t('班一覧へ') }}</NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.team-page {
  gap: 16px;
}
.team-heading {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.back-button {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  flex: none;
  border-radius: 12px;
  background: var(--white);
  color: var(--ink);
}
.team-about {
  padding: 20px;
}
.section-heading {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.5;
}
.team-about p {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.5;
}
.section-heading span {
  margin-left: 8px;
}
.missing-team {
  display: grid;
  gap: 12px;
  padding: 20px;
  font-size: 14px;
}
.missing-team p {
  margin: 0;
}
.back-button img {
  filter: var(--icon-filter);
}
</style>
