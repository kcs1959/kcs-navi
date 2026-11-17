<script setup lang="ts">
// 位置・時間差は固定値で持つ（Math.randomだとSSRとクライアントで値がずれ、
// hydrationミスマッチの原因になるため）。数値をずらして単調な繰り返しに見えないようにしている。
const shootingStars = [
  { top: 6, left: 18, delay: 0, duration: 7.5, size: 1 },
  { top: 14, left: 68, delay: 2.4, duration: 9, size: 0.8 },
  { top: 32, left: 42, delay: 5.1, duration: 8.2, size: 1.1 },
  { top: 22, left: 85, delay: 7.6, duration: 7.8, size: 0.9 },
]

const bubbles = [
  { left: 8, size: 14, delay: 0, duration: 13, color: 'var(--lavender)' },
  { left: 24, size: 9, delay: 2.2, duration: 10, color: 'var(--mint)' },
  { left: 42, size: 18, delay: 4.5, duration: 15, color: 'var(--lemon)' },
  { left: 58, size: 11, delay: 1.3, duration: 11, color: 'var(--peach)' },
  { left: 74, size: 15, delay: 6, duration: 14, color: 'var(--lavender)' },
  { left: 90, size: 10, delay: 3.6, duration: 12, color: 'var(--mint)' },
]
</script>

<template>
  <!-- Figmaの装飾は実寸で重ねる。画面の高さが伸びても柄を引き伸ばさず可読性を保つ。 -->
  <div class="festival-background" aria-hidden="true">
    <img class="motif motif-main" src="/figma/map-group.svg" alt="" />
    <img class="motif motif-curves" src="/figma/map-group1.svg" alt="" />
    <img class="motif motif-grid" src="/figma/map-group2.svg" alt="" />
    <img class="motif motif-small" src="/figma/map-group3.svg" alt="" />
    <!-- 流れ星・シャボン玉は常時表示する軽い装飾。祝祭感を足すための演出で情報は持たない。 -->
    <div class="sparkle-layer">
      <span
        v-for="(star, index) in shootingStars"
        :key="`star-${index}`"
        class="shooting-star"
        :style="{
          top: `${star.top}%`,
          left: `${star.left}%`,
          animationDelay: `${star.delay}s`,
          animationDuration: `${star.duration}s`,
          '--star-scale': star.size,
        }"
      />
      <span
        v-for="(bubble, index) in bubbles"
        :key="`bubble-${index}`"
        class="bubble"
        :style="{
          left: `${bubble.left}%`,
          width: `${bubble.size}px`,
          height: `${bubble.size}px`,
          background: bubble.color,
          animationDelay: `${bubble.delay}s`,
          animationDuration: `${bubble.duration}s`,
        }"
      />
    </div>
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
.sparkle-layer {
  position: absolute;
  inset: 0;
}
/* 流れ星：短い斜めの光の尾。既存の暖色パレット（オレンジ系）で、
   夜空の白い星ではなく祝祭の火花のような見え方にする。 */
.shooting-star {
  position: absolute;
  width: calc(90px * var(--star-scale, 1));
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, transparent, var(--strong), var(--orange));
  transform: rotate(32deg) scaleX(0);
  transform-origin: left center;
  opacity: 0;
  animation-name: shoot;
  animation-timing-function: ease-out;
  animation-iteration-count: infinite;
}
@keyframes shoot {
  0%,
  92% {
    opacity: 0;
    transform: rotate(32deg) scaleX(0) translate(0, 0);
  }
  93% {
    opacity: 1;
    transform: rotate(32deg) scaleX(1) translate(0, 0);
  }
  97% {
    opacity: 0.8;
    transform: rotate(32deg) scaleX(1) translate(70px, 44px);
  }
  98%,
  100% {
    opacity: 0;
    transform: rotate(32deg) scaleX(1) translate(70px, 44px);
  }
}
/* シャボン玉：パステル色の円が揺れながらゆっくり上昇して消える。 */
.bubble {
  position: absolute;
  bottom: -40px;
  border-radius: 50%;
  opacity: 0;
  /* 左上の光沢と右下の陰影で、シャボン玉のつやを表現する。 */
  box-shadow:
    inset 2px 3px 3px rgba(255, 255, 255, 0.7),
    inset -2px -2px 4px rgba(0, 0, 0, 0.08);
  animation-name: float-up;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}
@keyframes float-up {
  0% {
    opacity: 0;
    transform: translate(0, 0);
  }
  12% {
    opacity: 0.55;
  }
  50% {
    transform: translate(14px, -50vh);
  }
  88% {
    opacity: 0.4;
  }
  100% {
    opacity: 0;
    transform: translate(-10px, -100vh);
  }
}
@media (prefers-reduced-motion: reduce) {
  .sparkle-layer {
    display: none;
  }
}
</style>
