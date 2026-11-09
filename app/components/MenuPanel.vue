<script setup lang="ts">
const emit = defineEmits<{ close: [] }>()

const links = [
  {
    to: '/',
    title: 'ブースマップ',
    description: 'KCS のブースを確認しよう',
    icon: '/figma/menu-icon-map.svg',
  },
  {
    to: '/crowd',
    title: '来場者数・混雑状況',
    description: '混雑の目安をチェック',
    icon: '/figma/menu-icon-chart-no-axes-column.svg',
  },
  {
    to: '/exhibitions',
    title: '展示紹介',
    description: '三田祭に展示されている作品をまとめました！',
    icon: '/figma/menu-icon-layout-grid.svg',
  },
  {
    to: '/teams',
    title: '班紹介',
    description: 'KCSの班活動について',
    icon: '/figma/menu-icon-layout-grid.svg',
  },
]

const panel = ref<HTMLElement>()

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  // 背面のスクロールを止める（native dialog の body:has(dialog[open]) と同じ狙い）。
  document.body.style.overflow = 'hidden'
  panel.value?.focus()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="menu-overlay" @click.self="emit('close')">
    <div
      ref="panel"
      class="menu-popup stack"
      role="dialog"
      aria-modal="true"
      aria-label="サイトメニュー"
      tabindex="-1"
    >
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
            ><strong>{{ link.title }}</strong
            ><span>{{ link.description }}</span></span
          >
          <img src="/figma/menu-icon-chevron-right.svg" alt="" width="16" height="16" />
        </NuxtLink>
        <a
          href="https://www.kcs1959.jp/"
          target="_blank"
          rel="noopener noreferrer"
          class="menu-link"
          aria-label="KCS公式サイト（新しいタブで開く）"
          @click="emit('close')"
        >
          <img src="/figma/menu-icon-external-link.svg" alt="" width="24" height="24" />
          <span class="menu-link-text"
            ><strong>KCS公式サイト</strong><span>kcs1959.jp ↗</span></span
          >
          <img src="/figma/menu-icon-chevron-right.svg" alt="" width="16" height="16" />
        </a>
      </nav>

      <section class="card social-card" aria-labelledby="follow-heading">
        <h2 id="follow-heading">KCSをフォロー</h2>
        <div class="social-links">
          <a
            href="https://x.com/kcs1959"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="KCS公式X（新しいタブで開く）"
          >
            <img src="/figma/menu-icon-xbrand.svg" alt="" width="20" height="20" />
            <span>X ↗</span>
          </a>
          <a
            href="https://www.youtube.com/c/KCSKeioComputerSociety"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="KCS公式YouTube（新しいタブで開く）"
          >
            <img src="/figma/menu-icon-youtube.svg" alt="" width="20" height="20" />
            <span>YouTube ↗</span>
          </a>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* 開閉アニメーション（prefers-reduced-motion 時は main.css が一括で無効化）。 */
.menu-enter-active,
.menu-leave-active {
  transition: opacity 0.22s ease;
}
.menu-enter-active .menu-popup,
.menu-leave-active .menu-popup {
  transition: transform 0.26s cubic-bezier(0.22, 1, 0.36, 1);
}
.menu-enter-from,
.menu-leave-to {
  opacity: 0;
}
.menu-enter-from .menu-popup,
.menu-leave-to .menu-popup {
  transform: translateY(-12px) scale(0.96);
}
.menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  justify-content: center;
  padding: 84px 16px 24px;
  background: #4b2d2245;
  backdrop-filter: blur(3px);
  overflow-y: auto;
  overscroll-behavior: contain;
}
.menu-popup {
  width: 342px;
  max-width: calc(100vw - 32px);
  height: max-content;
  gap: 16px;
}
.menu-popup:focus {
  outline: none;
}
.menu-links {
  display: flex;
  flex-direction: column;
  padding: 12px;
  background: var(--glass);
}
.menu-link {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 65px;
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
  font-size: 12px;
  text-decoration: none;
}
.social-links img {
  flex: none;
}
</style>
