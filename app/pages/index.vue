<script setup lang="ts">
useHead({ title: '会場マップ' })
const { data, error, status, refresh } = await useFetch('/api/exhibitions', { key: 'exhibitions' })
const { openExhibition } = useExhibitionDialog()
const {
  data: stats,
  error: statsError,
  status: statsStatus,
  refresh: refreshStats,
} = useCrowdStats()
// deskKeyはDBの作品に対応する固定キー。座標編集やdesksテーブルを用いず配置を管理する。
const desks = [
  {
    key: 'desk-a',
    label: 'VR・体験',
    number: '01',
    icon: '/figma/map-icon-glasses.svg',
    size: 30,
    class: 'desk-vr',
  },
  {
    key: 'desk-b',
    label: 'ゲーム',
    number: '02',
    icon: '/figma/map-icon-gamepad2.svg',
    size: 30,
    class: 'desk-game',
  },
  {
    key: 'desk-c',
    label: '音楽',
    number: '03',
    icon: '/figma/map-icon-music2.svg',
    size: 22,
    class: 'desk-music',
  },
]
const worksAt = (key: string) =>
  data.value?.exhibitions.filter((exhibition) => exhibition.deskKey === key) ?? []
function selectDesk(key: string) {
  const works = worksAt(key)
  if (works[0]) openExhibition(works[0], works)
}
</script>
<template>
  <div class="page-content map-page">
    <PageHeading
      eyebrow="EXPLORE KCS"
      title="KCS ブースマップ"
      description="机をタップして、作品を見てみよう。"
    />
    <CrowdCard
      :stats="stats"
      :failed="Boolean(statsError)"
      :loading="statsStatus === 'pending'"
      @retry="refreshStats()"
    />
    <section class="card booth-map" aria-labelledby="map-title" :aria-busy="status === 'pending'">
      <div class="map-heading">
        <h2 id="map-title">展示マップ</h2>
        <span class="chip lemon">机をタップ</span>
      </div>
      <div class="room">
        <span class="entrance">入口 ↓</span><span class="exit">↑ 出口</span>
        <button
          v-for="desk in desks"
          :key="desk.key"
          class="desk"
          :class="desk.class"
          :disabled="!worksAt(desk.key).length"
          :aria-label="`${desk.label} 展示机${desk.number}、${worksAt(desk.key).length}作品の詳細を見る`"
          @click="selectDesk(desk.key)"
        >
          <img :src="desk.icon" alt="" :width="desk.size" :height="desk.size" />
          <span>{{ desk.label }}</span>
          <span v-if="desk.key !== 'desk-c'" class="chip desk-count"
            >{{ desk.number }} · {{ worksAt(desk.key).length }}作品</span
          >
        </button>
      </div>
      <p class="map-caption">※ 配置はイメージです</p>
    </section>
    <div v-if="error" class="error-card" role="alert">
      <p>展示情報を読み込めませんでした。</p>
      <button class="secondary-button" @click="refresh()">もう一度読み込む</button>
    </div>
    <p v-else-if="status === 'pending'" class="demo-notice" role="status">
      展示情報を読み込んでいます…
    </p>
    <p v-else-if="!data?.exhibitions.length" class="demo-notice">
      展示情報はまだ登録されていません。
    </p>
    <p v-if="data?.mode === 'demo'" class="demo-notice">プロトタイプ · 展示と人数はサンプルです</p>
    <NuxtLink class="play-fab" to="/games"
      ><img src="/figma/map-icon-gamepad3.svg" alt="" width="24" height="24" /><span
        >あそぶ</span
      ></NuxtLink
    >
  </div>
</template>
<style scoped>
.map-page {
  position: relative;
}
.booth-map {
  position: relative;
  padding: 16px 15px 8px;
  border-radius: 28px;
}
.map-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 2px 16px;
}
.map-heading h2 {
  font-size: 14px;
  margin: 0;
}
.lemon {
  background: var(--lemon);
}
.room {
  position: relative;
  height: 315px;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 20px;
}
.entrance,
.exit {
  position: absolute;
  top: 7px;
  font-size: 12px;
}
.entrance {
  left: 17px;
}
.exit {
  right: 26px;
}
.desk {
  position: absolute;
  background: white;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 18px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  transition:
    transform 0.15s,
    box-shadow 0.15s;
}
.desk-vr {
  left: 5.5%;
  top: 79px;
  width: 34.2%;
  height: 116px;
  box-shadow: 0 7px var(--lavender);
}
.desk-game {
  right: 5%;
  top: 49px;
  width: 34.2%;
  height: 116px;
  box-shadow: 0 7px var(--mint);
}
.desk-music {
  left: 28%;
  top: 221px;
  width: 44.5%;
  height: 60px;
  padding: 2px 4px;
  box-shadow: 0 7px var(--lemon);
}
.desk-vr .desk-count {
  background: var(--lavender);
}
.desk-game .desk-count {
  background: var(--mint);
}
.desk:hover:not(:disabled) {
  transform: translateY(-3px);
  border-color: var(--orange);
}
.desk:active:not(:disabled) {
  transform: translateY(3px);
}
.desk:disabled {
  opacity: 0.5;
  cursor: wait;
}
.map-caption {
  color: var(--muted);
  font-size: 10px;
  margin: 0 4px;
  line-height: 1.5;
}
.demo-notice {
  font-size: 10px;
  color: var(--muted);
  text-align: center;
}
.play-fab {
  position: absolute;
  right: 20px;
  top: 590px;
  width: 68px;
  height: 68px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--strong);
  font-size: 10px;
  box-shadow: 0 6px 20px #4b2d2214;
}
</style>
