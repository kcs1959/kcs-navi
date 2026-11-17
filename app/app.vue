<script setup lang="ts">
const { $serwist } = useNuxtApp()
void $serwist?.register({ immediate: true })
// beforeinstallprompt を取り逃がさないよう、メニューを開く前からアプリ初期化時に購読する
if (import.meta.client) useInstallPrompt()
const route = useRoute()
const config = useRuntimeConfig()
const { selectedExhibition, siblings, closeExhibition, openExhibition } = useExhibitionDialog()
const isMenuOpen = ref(false)

function closeMenu() {
  isMenuOpen.value = false
}

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

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
  bodyAttrs: { class: selectedExhibition.value || isMenuOpen.value ? 'exhibition-open' : '' },
  titleTemplate: (title) => (title ? `${title} | KCS Navi` : 'KCS Navi | 三田祭2026'),
  link: [{ rel: 'canonical', href: new URL(route.path, config.public.siteUrl).href }],
}))
watch(
  () => route.path,
  () => {
    closeMenu()
    closeExhibition()
  },
)
</script>

<template>
  <div>
    <FestivalBackground />
    <a class="skip-link" href="#main-content">本文へスキップ</a>
    <AppHeader :is-menu-open="isMenuOpen" @toggle-menu="toggleMenu" />
    <main id="main-content" :class="{ 'with-navigation': showNavigation }">
      <OfflineBanner />
      <AppPageTransition />
    </main>

    <Transition name="menu-popup">
      <div v-if="isMenuOpen" class="menu-popup-overlay">
        <div
          id="menu-popup"
          class="menu-popup-container"
          role="dialog"
          aria-modal="true"
          aria-labelledby="menu-title"
        >
          <MenuContent @close="closeMenu" />
        </div>
      </div>
    </Transition>

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

<style>
.menu-popup-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 20px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.menu-popup-container {
  width: 100%;
  max-width: 540px;
  max-height: calc(100dvh - 40px);
  background: var(--paper, #fff);
  border-radius: 24px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  overflow: auto;
  overscroll-behavior: contain;
}

.menu-popup-enter-active,
.menu-popup-leave-active {
  transition: opacity 0.25s ease;
}
.menu-popup-enter-active .menu-popup-container,
.menu-popup-leave-active .menu-popup-container {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.menu-popup-enter-from,
.menu-popup-leave-to {
  opacity: 0;
}
.menu-popup-enter-from .menu-popup-container,
.menu-popup-leave-to .menu-popup-container {
  transform: translateY(-20px) scale(0.96);
}

@media (max-width: 599px) {
  .menu-popup-overlay {
    padding: 12px;
  }

  .menu-popup-container {
    max-height: calc(100dvh - 24px);
  }
}
</style>
