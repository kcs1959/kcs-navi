<script setup lang="ts">
useHead({ title: 'チェックイン', meta: [{ name: 'robots', content: 'noindex, nofollow' }] })
const route = useRoute()
const registrationForm = ref<HTMLFormElement | null>(null)
const hasError = computed(() => typeof route.query.error === 'string')
const errorMessage = computed(() =>
  route.query.error === 'busy'
    ? 'ただいま受付が混み合っています。少し時間をおいて、もう一度お試しください。'
    : route.query.error === 'forbidden'
      ? '受付ページを確認できませんでした。入口のQRコードからもう一度開いてください。'
      : 'チェックインを完了できませんでした。通信環境を確認して、もう一度お試しください。',
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
        <h1 id="checkin-heading">受付を完了できませんでした</h1>
        <p role="alert">{{ errorMessage }}</p>
        <a href="/checkin" class="primary-button">受付を再試行</a>
        <NuxtLink to="/" class="secondary-button">会場マップへ</NuxtLink>
      </template>
      <template v-else>
        <span class="checkin-spinner" aria-hidden="true" />
        <h1 id="checkin-heading">チェックインしています</h1>
        <p role="status">受付が終わるまで、このままお待ちください。</p>
        <form ref="registrationForm" method="post" action="/api/checkins" />
        <!-- noscript内をプレーンテキストにし、JS有効時のブラウザ解析とVueの水和を一致させる。 -->
        <noscript
          >自動チェックインにはJavaScriptが必要です。ブラウザのJavaScriptを有効にして、入口のQRコードをもう一度読み取ってください。</noscript
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
  color: var(--kcs-muted, #7d5b49);
}
.checkin-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--kcs-peach, #ffd8bc);
  border-top-color: var(--kcs-orange, #ee8b4a);
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
