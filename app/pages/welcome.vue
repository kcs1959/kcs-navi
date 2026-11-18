<script setup lang="ts">
useHead({ title: 'ようこそ' })
const route = useRoute()
const checkedInAt = computed(() => {
  const value = typeof route.query.checkedInAt === 'string' ? route.query.checkedInAt : ''
  const date = new Date(value)
  return value && Number.isFinite(date.getTime()) ? date : null
})
const visitorNumber = computed(() => {
  const raw = route.query.visitorNumber
  if (!checkedInAt.value || typeof raw !== 'string' || !/^[1-9]\d*$/.test(raw)) return null
  const value = Number(raw)
  return Number.isSafeInteger(value) ? value : null
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
      <p v-if="visitorNumber" class="welcome-message visitor-message">
        <span>あなたは本日</span>
        <strong class="visitor-number"
          >{{ visitorNumber.toLocaleString('ja-JP') }}<span>人目</span></strong
        >
        <span>の来場者です！</span>
      </p>
      <p class="welcome-message">三田祭KCSブースへのご来場、ありがとうございます！<br /></p>
      <span v-if="receiptTime" class="chip receipt-time">受付日時 {{ receiptTime }}</span>
      <NuxtLink to="/" class="primary-button map-button">会場マップへ</NuxtLink>
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
  background: var(--mint);
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
  color: var(--muted);
}
.receipt-time {
  background: var(--paper);
}
.visitor-message {
  display: grid;
  gap: 4px;
  width: 100%;
}
.visitor-number {
  color: var(--ink);
  font-size: clamp(36px, 10vw, 48px);
  line-height: 1.3;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}
.visitor-number span {
  margin-left: 4px;
  font-size: 0.58em;
}
.map-button {
  width: 100%;
}
.success-badge img {
  filter: var(--icon-filter);
}
</style>
