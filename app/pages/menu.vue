<script setup lang="ts">
useHead({ title: 'メニュー' })

const links = [
  {
    to: '/',
    title: 'ブースマップ',
    description: 'ブースの配置を見ることができます',
    icon: '/figma/menu-icon-map.svg',
  },
  {
    to: '/crowd',
    title: '来場者数・混雑状況',
    description: '混雑の目安をチェックできます',
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
    description: 'KCSの班活動の紹介ページ',
    icon: '/figma/menu-icon-layout-grid.svg',
  },
]
</script>

<template>
  <div class="page-content stack menu-page">
    <PageHeading eyebrow="MENU" title="メニュー" />

    <nav class="card menu-links" aria-label="サイトメニュー">
      <NuxtLink v-for="link in links" :key="link.to" :to="link.to" class="menu-link">
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
      >
        <img src="/figma/menu-icon-external-link.svg" alt="" width="24" height="24" />
        <span class="menu-link-text"><strong>KCS公式サイト</strong><span>kcs1959.jp ↗</span></span>
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
</template>

<style scoped>
.menu-page {
  gap: 16px;
}
.menu-links {
  display: flex;
  flex-direction: column;
  padding: 12px;
  background: var(--kcs-glass, #fffcf5);
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
  color: var(--kcs-muted, #7d5b49);
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
  background: var(--kcs-paper, #fff6ea);
  font-size: 12px;
  text-decoration: none;
}
.social-links img {
  flex: none;
}
</style>
