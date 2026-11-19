<script setup lang="ts">
const { promptEvent, iosSafari, mobileChrome, install } = useInstallPrompt()
const showChromeSteps = ref(false)

async function handleInstall() {
  if (promptEvent.value) {
    await install()
  } else {
    showChromeSteps.value = !showChromeSteps.value
  }
}
</script>

<template>
  <section class="card install-card" aria-labelledby="install-heading">
    <h2 id="install-heading">ホーム画面に追加</h2>
    <p>アプリのように全画面で開けて、一度見たページは通信が不安定でも読めます。</p>
    <button
      v-if="promptEvent || mobileChrome"
      type="button"
      class="primary-button"
      :aria-expanded="!promptEvent ? showChromeSteps : undefined"
      :aria-controls="!promptEvent ? 'chrome-install-steps' : undefined"
      @click="handleInstall"
    >
      ホーム画面に追加する
    </button>
    <ol v-if="!promptEvent && iosSafari" class="install-steps">
      <li>Safari 下部の「共有」ボタンをタップ</li>
      <li>「ホーム画面に追加」を選ぶ</li>
      <li>右上の「追加」をタップ</li>
    </ol>
    <ol
      v-if="!promptEvent && mobileChrome && showChromeSteps"
      id="chrome-install-steps"
      class="install-steps"
    >
      <li v-if="mobileChrome === 'ios'">Chrome のアドレスバーの「共有」ボタンをタップ</li>
      <li v-else>Chrome 右上の「︙」メニューをタップ</li>
      <li>「ホーム画面に追加」を選ぶ</li>
      <li>画面の案内に従って追加する</li>
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
