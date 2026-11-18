<script setup lang="ts">
const { t } = useI18n()

useHead(() => ({
  title: t('checkin.meta.title'),
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
}))
const route = useRoute()
const registrationForm = ref<HTMLFormElement | null>(null)
const hasError = computed(() => typeof route.query.error === 'string')
const errorMessage = computed(() =>
  route.query.error === 'busy'
    ? t('checkin.errors.busy')
    : route.query.error === 'forbidden'
      ? t('checkin.errors.forbidden')
      : t('checkin.errors.default'),
)

onMounted(() => {
  // 失敗後の再表示で自動送信するとリダイレクトが繰り返されるため、再試行はリンクから開始する。
  if (hasError.value) return
  // 通常のフォーム送信で POST → 303 → GET と遷移し、Welcome の再読み込みによる再登録を防ぐ。
  registrationForm.value?.submit()
})
</script>

<template>
  <div class="page-content checkin-page">
    <section class="card checkin-card" aria-labelledby="checkin-heading">
      <template v-if="hasError">
        <h1 id="checkin-heading">{{ t('checkin.errorHeading') }}</h1>
        <p role="alert">{{ errorMessage }}</p>
        <a href="/checkin" class="primary-button">{{ t('checkin.retry') }}</a>
        <NuxtLink to="/" class="secondary-button">{{ t('checkin.mapLink') }}</NuxtLink>
      </template>
      <template v-else>
        <span class="checkin-spinner" aria-hidden="true" />
        <h1 id="checkin-heading">{{ t('checkin.progressHeading') }}</h1>
        <p role="status">{{ t('checkin.progressStatus') }}</p>
        <form ref="registrationForm" method="post" action="/api/checkins" />
        <!-- noscript内をプレーンテキストにし、JS有効時のブラウザ解析とVueの水和を一致させる。 -->
        <noscript
          >自動チェックインにはJavaScriptが必要です。ブラウザのJavaScriptを有効にして、入口のQRコードをもう一度読み取ってください。
          / JavaScript is required for automatic check-in. Enable JavaScript in your browser, then
          scan the entrance QR code again.</noscript
        >
      </template>
    </section>
  </div>
</template>

<style scoped>
.checkin-page {
  padding-top: 88px;
}
.checkin-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 20px;
  text-align: center;
}
.checkin-card h1 {
  font-size: 22px;
  line-height: 1.5;
  margin: 0;
}
.checkin-card p {
  font-size: 12px;
  line-height: 1.5;
  margin: 0;
  color: var(--muted);
}
.checkin-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--peach);
  border-top-color: var(--orange);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .checkin-spinner {
    animation: none;
  }
}
</style>
