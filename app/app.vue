<script setup lang="ts">
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
  titleTemplate: (title) => (title ? `${title} | KCS Navi` : 'KCS Navi | 三田祭2026'),
  link: [{ rel: 'canonical', href: new URL(route.path, config.public.siteUrl).href }],
}))
watch(() => route.path, closeExhibition)
</script>

<template>
  <div class="site-shell">
    <FestivalBackground />
    <a class="skip-link" href="#main-content">本文へスキップ</a>
    <header class="site-header">
      <NuxtLink class="brand" to="/" aria-label="KCS Navi 会場マップへ">
        <KcsLogo />
        <span class="brand-copy"><strong>KCS Navi</strong><small>三田祭 2026</small></span>
      </NuxtLink>
      <NuxtLink
        class="icon-button"
        :to="route.path === '/menu' ? '/' : '/menu'"
        :aria-label="route.path === '/menu' ? 'メニューを閉じる' : 'メニューを開く'"
        :aria-expanded="route.path === '/menu'"
      >
        <img
          v-if="route.path === '/menu'"
          src="/figma/menu-icon-x.svg"
          alt=""
          width="22"
          height="22"
        />
        <img v-else src="/figma/map-icon-menu.svg" alt="" width="24" height="24" />
      </NuxtLink>
    </header>
    <main id="main-content" :class="{ 'with-navigation': showNavigation }">
      <NuxtPage />
    </main>
    <nav v-if="showNavigation" class="bottom-navigation" aria-label="メインナビゲーション">
      <NuxtLink to="/" :class="{ active: route.path === '/' }"
        ><img src="/figma/crowd-icon-map.svg" width="18" height="18" alt="" />マップ</NuxtLink
      >
      <NuxtLink
        to="/exhibitions"
        :class="{
          active: route.path.startsWith('/exhibitions') || route.path.startsWith('/teams'),
        }"
        ><img src="/figma/crowd-icon-layout-grid.svg" width="18" height="18" alt="" />展示</NuxtLink
      >
      <NuxtLink to="/crowd" :class="{ active: route.path === '/crowd' }"
        ><img
          src="/figma/crowd-icon-chart-no-axes-column.svg"
          width="18"
          height="18"
          alt=""
        />混雑</NuxtLink
      >
    </nav>
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
