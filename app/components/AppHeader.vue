<script setup lang="ts">
const props = withDefaults(
  defineProps<{ title?: string; subtitle?: string; isMenuOpen?: boolean }>(),
  {
    isMenuOpen: false,
  },
)
const emit = defineEmits<{ 'toggle-menu': [] }>()
const route = useRoute()
const { t } = useI18n()
const displayTitle = computed(() => props.title ?? 'KCS Navi')
const displaySubtitle = computed(() => props.subtitle ?? t('header.subtitle'))
// 通常のチェックイン中は即座にPOSTするため操作を挟ませず、送信しないエラー画面では切替可能にする。
// 成功時は遷移先のWelcome画面で切り替えられる。
const showLocaleSwitcher = computed(
  () => route.path !== '/checkin' || typeof route.query.error === 'string',
)

const headerSlot = ref<HTMLElement>()
const header = ref<HTMLElement>()
const isFloating = ref(false)
const headerHeight = ref(0)
let resizeObserver: ResizeObserver | undefined
let scrollFrame = 0

function updatePosition() {
  if (!headerSlot.value || !header.value) return

  const slot = headerSlot.value.getBoundingClientRect()
  headerHeight.value = header.value.getBoundingClientRect().height

  // 元の位置に戻るまでは固定表示を保ち、途中でヘッダーが消えないようにする。
  if (slot.top >= 0) isFloating.value = false
  else if (slot.top + headerHeight.value <= 0) isFloating.value = true
}

function schedulePositionUpdate() {
  if (scrollFrame) return
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = 0
    updatePosition()
  })
}

onMounted(() => {
  updatePosition()
  resizeObserver = new ResizeObserver(schedulePositionUpdate)
  if (header.value) resizeObserver.observe(header.value)
  if (headerSlot.value) resizeObserver.observe(headerSlot.value)
  window.addEventListener('scroll', schedulePositionUpdate, { passive: true })
  window.addEventListener('resize', schedulePositionUpdate)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  cancelAnimationFrame(scrollFrame)
  window.removeEventListener('scroll', schedulePositionUpdate)
  window.removeEventListener('resize', schedulePositionUpdate)
})

const externalLinks = [
  {
    labelKey: 'header.officialSite',
    href: 'https://www.kcs1959.jp/',
    icon: '/figma/kcs_official_light.png',
  },
]
</script>

<template>
  <div
    ref="headerSlot"
    class="header-slot"
    :style="isFloating ? { height: `${headerHeight}px` } : undefined"
  >
    <header ref="header" class="site-header" :class="{ 'is-floating': isFloating }">
      <NuxtLink class="brand" to="/" :aria-label="t('header.brandAriaLabel')">
        <KcsLogo />
        <span class="brand-copy">
          <strong>{{ displayTitle }}</strong>
          <small v-if="displaySubtitle">{{ displaySubtitle }}</small>
        </span>
      </NuxtLink>
      <nav class="header-navigation" :aria-label="t('header.navigationLabel')">
        <NuxtLink
          class="header-link"
          to="/"
          :aria-label="t('header.homeAriaLabel')"
          :title="t('header.homeAriaLabel')"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            aria-hidden="true"
          >
            <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-8H9v8H4a1 1 0 0 1-1-1Z" />
          </svg>
        </NuxtLink>
        <a
          v-for="link in externalLinks"
          :key="link.href"
          class="header-link"
          :href="link.href"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="t('header.externalLinkAriaLabel', { label: t(link.labelKey) })"
          :title="t('header.externalLinkAriaLabel', { label: t(link.labelKey) })"
        >
          <img v-if="link.icon" :src="link.icon" alt="" width="22" height="22" />
          <svg
            v-else
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
          </svg>
        </a>
        <LocaleSwitcher v-if="showLocaleSwitcher" class="header-locale-switcher" />
        <ThemeToggle />
        <button
          type="button"
          class="header-link menu-toggle-btn"
          :aria-expanded="props.isMenuOpen"
          aria-controls="menu-popup"
          :aria-label="props.isMenuOpen ? t('header.closeMenu') : t('header.openMenu')"
          :title="props.isMenuOpen ? t('header.closeMenu') : t('header.openMenu')"
          @click="emit('toggle-menu')"
        >
          <img
            :src="props.isMenuOpen ? '/figma/menu-icon-x.svg' : '/figma/map-icon-menu.svg'"
            alt=""
            width="24"
            height="24"
          />
        </button>
      </nav>
    </header>
  </div>
</template>

<style scoped>
.header-slot {
  position: relative;
  z-index: 5;
}
.site-header.is-floating {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  border-radius: 0;
  padding-inline: max(24px, calc((100% - 480px) / 2 + 24px));
  background: var(--glass);
  animation: header-slide-in 220ms ease-out;
}
@keyframes header-slide-in {
  from {
    transform: translateY(-100%);
  }
  to {
    transform: translateY(0);
  }
}
.site-header {
  position: relative;
  min-height: 76px;
  flex-wrap: wrap;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 14px 24px;
  background: var(--glass);
  z-index: 5;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}
.brand-copy {
  display: flex;
  flex-direction: column;
  overflow-wrap: anywhere;
}
.brand-copy strong {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.5;
}
.brand-copy small {
  font-size: 10px;
  line-height: 1.5;
  color: var(--muted);
}
.header-navigation {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.header-locale-switcher {
  flex-shrink: 0;
}
.header-link,
.menu-toggle-btn {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--white);
  border: none;
  cursor: pointer;
  padding: 0;
}
.header-link:hover,
.menu-toggle-btn:hover,
.header-link[aria-current='page'] {
  background: var(--peach);
}
.header-link svg {
  width: 22px;
  height: 22px;
}
.theme-toggle {
  flex-shrink: 0;
}
@media (min-width: 600px) {
  .site-header {
    border-radius: 30px 30px 0 0;
  }
}
@media (max-width: 599px) {
  .header-navigation {
    width: 100%;
    justify-content: flex-end;
  }
}
@media (max-width: 359px) {
  .site-header,
  .site-header.is-floating {
    padding-inline: 16px;
  }
}
</style>
