<script setup lang="ts">
const { $serwist } = useNuxtApp()
void $serwist?.register({ immediate: true })
// beforeinstallprompt を取り逃がさないよう、メニューを開く前からアプリ初期化時に購読する
if (import.meta.client) useInstallPrompt()
const route = useRoute()
const config = useRuntimeConfig()
const { selectedExhibition, siblings, closeExhibition, openExhibition } = useExhibitionDialog()
const {
  data: teamResponse,
  error: teamError,
  refresh: refreshTeams,
} = await useFetch('/api/teams', { key: 'teams' })
const team = computed(() =>
  teamResponse.value?.teams.find((item) => item.id === selectedExhibition.value?.teamId),
)
const showNavigation = computed(() => !['/', '/menu', '/checkin', '/welcome'].includes(route.path))

// URLの組み立てを環境変数に集約し、ローカルURLが公開環境のcanonicalに残るのを防ぐ。
useHead(() => ({
  htmlAttrs: { lang: 'ja' },
  bodyAttrs: { class: selectedExhibition.value ? 'exhibition-open' : '' },
  titleTemplate: (title) => (title ? `${title} | KCS Navi` : 'KCS Navi | 三田祭2026'),
  link: [{ rel: 'canonical', href: new URL(route.path, config.public.siteUrl).href }],
}))
watch(() => route.path, closeExhibition)
</script>

<template>
  <div>
    <FestivalBackground />
    <a class="skip-link" href="#main-content">本文へスキップ</a>
    <AppHeader />
    <main id="main-content" :class="{ 'with-navigation': showNavigation }">
      <OfflineBanner />
      <AppPageTransition />
    </main>
    <ExhibitionModal
      v-if="selectedExhibition"
      :exhibition="selectedExhibition"
      :team="team"
      :team-error="Boolean(teamError)"
      :siblings="siblings"
      @close="closeExhibition"
      @retry-teams="refreshTeams()"
      @select="openExhibition($event, siblings)"
    />
  </div>
</template>
