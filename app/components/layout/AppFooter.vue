<template>
  <!-- 全ページ共通のフッター。背景を半透明にして、背後の装飾背景を透過させる。 -->
  <footer class="app-footer">
    <p class="footer-text">ⓒ 2026 KCS Web Team</p>
  </footer>
</template>

<style scoped>
.app-footer {
  padding: 10px 24px 12px;
  /* テーマ（ライト/ダーク）のガラス色を透明に混ぜて半透明にする。 */
  background: color-mix(in srgb, var(--glass, #fffcf5) 55%, transparent);
  text-align: center;
}
.footer-text {
  margin: 0;
  font-size: 15px;
  line-height: 1.5;
  color: var(--muted, #7d5b49);
}
</style>
