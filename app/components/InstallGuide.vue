<script setup lang="ts">
const { promptEvent, installed, iosSafari, install } = useInstallPrompt()
// インストール済みと、どちらの案内も出せないブラウザでは何も出さない。
const visible = computed(() => !installed.value && (promptEvent.value !== null || iosSafari.value))
</script>

<template>
  <section v-if="visible" class="card install-card" aria-labelledby="install-heading">
    <h2 id="install-heading">ホーム画面に追加</h2>
    <p>アプリのように全画面で開けて、一度見たページは通信が不安定でも読めます。</p>
    <button v-if="promptEvent" type="button" class="primary-button" @click="install">
      ホーム画面に追加する
    </button>
    <ol v-else class="install-steps">
      <li>Safari 下部の「共有」ボタンをタップ</li>
      <li>「ホーム画面に追加」を選ぶ</li>
      <li>右上の「追加」をタップ</li>
    </ol>
  </section>
</template>

<style scoped>
.install-card {
  display: grid;
  gap: 12px;
  padding: 20px;
}
.install-card h2 {
  margin: 0;
  font-size: 14px;
}
.install-card p {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--muted);
}
.install-steps {
  margin: 0;
  padding-left: 20px;
  display: grid;
  gap: 6px;
  font-size: 12px;
  line-height: 1.6;
}
</style>
