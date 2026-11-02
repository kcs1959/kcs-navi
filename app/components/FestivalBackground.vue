<template>
  <!-- Figmaの装飾は実寸で重ねる。画面の高さが伸びても柄を引き伸ばさず可読性を保つ。 -->
  <div class="festival-background" aria-hidden="true">
    <img class="motif motif-main" src="/figma/map-group.svg" alt="" />
    <img class="motif motif-curves" src="/figma/map-group1.svg" alt="" />
    <img class="motif motif-grid" src="/figma/map-group2.svg" alt="" />
    <img class="motif motif-small" src="/figma/map-group3.svg" alt="" />
  </div>
</template>

<style scoped>
.festival-background {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  border-radius: inherit;
}
.motif {
  position: absolute;
  max-width: none;
}
.motif-main {
  left: -30px;
  top: -2px;
}
.motif-curves {
  left: -121px;
  top: 83px;
}
.motif-grid {
  left: 217px;
  top: 207px;
}
.motif-small {
  left: 37px;
  top: 211px;
}
</style>
