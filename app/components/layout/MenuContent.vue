<script setup lang="ts">
withDefaults(defineProps<{ showClose?: boolean }>(), { showClose: true })
const emit = defineEmits<{ close: [] }>()
// const { promptEvent, installed, iosSafari, mobileChrome } = useInstallPrompt()

const links = [
  {
    to: '/',
    title: 'ブースマップ',
    icon: '/figma/menu-icon-map.svg',
  },
  {
    to: '/crowd',
    title: '混雑状況・来場者数',
    icon: '/figma/menu-icon-chart-no-axes-column.svg',
  },
  {
    to: '/exhibitions',
    title: '展示作品',
    icon: '/figma/menu-icon-layout-grid.svg',
  },
  {
    to: '/teams',
    title: '班紹介',
    icon: '/figma/menu-icon-layout-grid.svg',
  },
]
</script>

<template>
  <div class="page-content stack menu-page">
    <header class="menu-heading">
      <div class="page-heading">
        <h1 id="menu-title">メニュー</h1>
      </div>
      <button
        v-if="showClose"
        type="button"
        class="icon-button menu-close"
        aria-label="メニューを閉じる"
        @click="emit('close')"
      >
        <img src="/figma/menu-icon-x.svg" alt="" width="22" height="22" />
      </button>
    </header>

    <nav class="card menu-links" aria-label="サイトメニュー">
      <NuxtLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="menu-link"
        @click="emit('close')"
      >
        <img :src="link.icon" alt="" width="24" height="24" />
        <span class="menu-link-text"
          ><strong>{{ link.title }}</strong></span
        >
        <img src="/figma/menu-icon-chevron-right.svg" alt="" width="16" height="16" />
      </NuxtLink>
      <a
        href="https://mita-oni.kcs1959.workers.dev/"
        target="_blank"
        rel="noopener noreferrer"
        class="menu-link"
        aria-label="mita-oni 鬼ごっこサイト（新しいタブで開く）"
        @click="emit('close')"
      >
        <img src="/figma/menu-icon-gamepad2.svg" alt="" width="24" height="24" />
        <span class="menu-link-text"><strong>mita-oni</strong><span>鬼ごっこサイト ↗</span></span>
        <img src="/figma/menu-icon-chevron-right.svg" alt="" width="16" height="16" />
      </a>
      <a
        href="https://www.kcs1959.jp/"
        target="_blank"
        rel="noopener noreferrer"
        class="menu-link"
        aria-label="KCS公式サイト（新しいタブで開く）"
        @click="emit('close')"
      >
        <img src="/figma/menu-icon-external-link.svg" alt="" width="24" height="24" />
        <span class="menu-link-text"><strong>KCS公式サイト</strong><span>kcs1959.jp ↗</span></span>
        <img src="/figma/menu-icon-chevron-right.svg" alt="" width="16" height="16" />
      </a>
    </nav>

    <!--InstallGuide v-if="!installed && (promptEvent || iosSafari || mobileChrome)" /-->

    <section class="card social-card" aria-labelledby="follow-heading">
      <h2 id="follow-heading">KCSをフォロー</h2>
      <div class="social-links">
        <a
          href="https://x.com/kcs1959"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="KCS公式X（新しいタブで開く）"
          @click="emit('close')"
        >
          <img src="/figma/menu-icon-xbrand.svg" alt="" width="20" height="20" />
          <span>X ↗</span>
        </a>
        <a
          href="https://www.instagram.com/kcs1959/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="KCS公式Instagram（新しいタブで開く）"
          @click="emit('close')"
        >
          <img src="/figma/menu-icon-instagram.svg" alt="" width="20" height="20" />
          <span>Instagram ↗</span>
        </a>
        <a
          href="https://www.youtube.com/c/KCSKeioComputerSociety"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="KCS公式YouTube（新しいタブで開く）"
          @click="emit('close')"
        >
          <img src="/figma/menu-icon-youtube.svg" alt="" width="20" height="20" />
          <span>YouTube ↗</span>
        </a>
        <a
          href="https://github.com/kcs1959"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="KCS公式GitHub（新しいタブで開く）"
          @click="emit('close')"
        >
          <img src="/figma/menu-icon-github.svg" alt="" width="20" height="20" />
          <span>GitHub ↗</span>
        </a>
      </div>
    </section>
  </div>
</template>

<style scoped>
.menu-page {
  gap: 16px;
  padding: 20px;
}
.menu-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.menu-close {
  flex: none;
}
.menu-links {
  display: flex;
  flex-direction: column;
  padding: 12px;
  background: var(--glass);
  color: var(--ink);
}
.menu-link {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 52px;
  padding: 14px 0;
  text-decoration: none;
}
.menu-link > img {
  flex: none;
}
.menu-link-text {
  flex: 1;
  min-width: 0;
  display: grid;
}
.menu-link-text strong {
  font-size: 14px;
  line-height: 1.5;
}
.menu-link-text > span {
  color: var(--muted);
  font-size: 10px;
  line-height: 1.5;
}
.social-card {
  display: grid;
  gap: 12px;
  padding: 20px;
}
.social-card h2 {
  margin: 0;
  font-size: 14px;
}
.social-links {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.social-links a {
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 12px;
  background: var(--paper);
  color: var(--ink);
  font-size: 12px;
  text-decoration: none;
}
.social-links img {
  flex: none;
}
.menu-link > img,
.social-links img {
  filter: var(--icon-filter);
}
</style>
