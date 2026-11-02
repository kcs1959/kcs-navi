<script setup lang="ts">
import type { ExhibitionsResponse, TeamsResponse } from '~~/shared/types'

const route = useRoute()
const { data, error, refresh } = await useFetch<TeamsResponse>('/api/teams', { key: 'teams' })
const {
  data: works,
  error: worksError,
  refresh: refreshWorks,
} = await useFetch<ExhibitionsResponse>('/api/exhibitions', { key: 'exhibitions' })
const team = computed(() =>
  data.value?.teams.find(
    (item) => String(item.id) === route.params.id || item.key === route.params.id,
  ),
)
const teamWorks = computed(
  () => works.value?.exhibitions.filter((work) => work.teamId === team.value?.id) ?? [],
)
const { openExhibition } = useExhibitionDialog()

useHead(() => ({ title: team.value?.name ?? '班紹介' }))

</script>

<template>
  <div class="page-content stack team-page">
    <div class="team-heading">
      <NuxtLink to="/teams" class="back-button" aria-label="班一覧に戻る">
        <img src="/figma/team-icon-arrow-left.svg" alt="" width="22" height="22" />
      </NuxtLink>
      <PageHeading eyebrow="MEET THE TEAM" :title="team?.name ?? '班紹介'" />
    </div>
    <div v-if="error" class="error-card" role="alert">
      <p>班の情報を読み込めませんでした。</p>
      <button class="secondary-button" type="button" @click="refresh()">再読み込み</button>
    </div>
    <template v-else-if="team">
      <section class="card team-about">
        <div v-if="team.key === 'vr'" class="team-artwork">
          <img src="/figma/team-frame.svg" alt="" width="302" height="140" />
        </div>
        <p>{{ team.description }}</p>
      </section>
      <h2 class="section-heading">
        この班の作品 <span>{{ teamWorks.length }}</span>
      </h2>
      <div v-if="worksError" class="error-card" role="alert">
        <p>作品を読み込めませんでした。</p>
        <button class="secondary-button" type="button" @click="refreshWorks()">再読み込み</button>
      </div>
      <ExhibitionCard
        v-for="exhibition in teamWorks"
        :key="exhibition.id"
        :exhibition="exhibition"
        :team="team"
        :illustration="team.key === 'vr' ? '/figma/team-frame1.svg' : undefined"
        :show-description="false"
        @select="openExhibition(exhibition)"
      />
      <p v-if="works && !teamWorks.length" class="card text-muted">この班の作品は準備中です。</p>
    </template>
    <div v-else-if="data" class="card missing-team">
      <p>この班は見つかりませんでした。</p>
      <NuxtLink class="secondary-button" to="/teams">班一覧へ</NuxtLink>
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
  background: #fff;
}
.team-about {
  display: grid;
  gap: 12px;
  /* 枠線を含む20pxの余白。302pxの素材を狭い画面以外で切り取らない。 */
  padding: 19px;
}
.team-artwork {
  position: relative;
  overflow: hidden;
  border-radius: 20px;
  height: 140px;
  background: var(--kcs-lavender, #e5dcf9);
}
.team-artwork img {
  display: block;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  max-width: none;
}
.team-about h2,
.section-heading {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.5;
}
.team-about p {
  margin: 0;
  color: var(--kcs-muted, #7d5b49);
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
</style>
