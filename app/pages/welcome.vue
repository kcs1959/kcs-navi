<script setup lang="ts">
useHead({ title: 'ようこそ' })
const route = useRoute()
const checkedInAt = computed(() => {
  const value = typeof route.query.checkedInAt === 'string' ? route.query.checkedInAt : ''
  const date = new Date(value)
  return value && Number.isFinite(date.getTime()) ? date : null
})
const receiptTime = computed(() =>
  checkedInAt.value
    ? new Intl.DateTimeFormat('ja-JP', {
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(checkedInAt.value)
    : '',
)
</script>

<template>
  <div class="page-content welcome-page">
    <section class="card welcome-card" aria-labelledby="welcome-title">
      <div class="success-badge">
        <img src="/figma/welcome-icon-check.svg" alt="" width="48" height="48" />
      </div>
      <h1 id="welcome-title">{{ checkedInAt ? 'チェックインしました！' : 'KCSへようこそ！' }}</h1>
      <p class="welcome-message">
        ご来場ありがとうございます。<br />気になる作品を、見つけてみてね。
      </p>
      <span v-if="receiptTime" class="chip receipt-time">受付日時 {{ receiptTime }}</span>
      <NuxtLink to="/" class="primary-button map-button">会場マップへ</NuxtLink>
      <p class="welcome-note">展示マップから、各作品の詳細を見られます。</p>
    </section>
  </div>
</template>

<style scoped>
.welcome-page {
  padding-top: 88px;
}
.welcome-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 20px;
}
.success-badge {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: var(--kcs-mint, #d5e9d5);
  display: grid;
  place-items: center;
}
.welcome-card h1 {
  margin: 0;
  font-size: 22px;
  line-height: 1.5;
  text-align: center;
}
.welcome-message {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  text-align: center;
  color: var(--kcs-muted, #7d5b49);
}
.receipt-time {
  background: var(--kcs-paper, #fff6ea);
}
.map-button {
  width: 100%;
}
.welcome-note {
  margin: 0;
  align-self: stretch;
  font-size: 10px;
  color: var(--kcs-muted, #7d5b49);
  line-height: 1.5;
}
</style>
