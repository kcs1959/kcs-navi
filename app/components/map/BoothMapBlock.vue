<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    x?: number
    y?: number
    z?: number
    width: number
    depth: number
    height: number
  }>(),
  { x: 0, y: 0, z: 0 },
)

// 全ての家具・壁で同じ投影を使い、寸法だけで形を調整できるようにする。
const points = computed(() => {
  const w = props.width * 0.75
  const d = props.depth * 0.75
  const wy = props.width * 0.4
  const dy = props.depth * 0.4
  const h = props.height
  return {
    top: `0,${-h} ${w},${wy - h} ${w - d},${wy + dy - h} ${-d},${dy - h}`,
    left: `${-d},${dy - h} ${w - d},${wy + dy - h} ${w - d},${wy + dy} ${-d},${dy}`,
    right: `${w},${wy - h} ${w - d},${wy + dy - h} ${w - d},${wy + dy} ${w},${wy}`,
  }
})
</script>

<template>
  <g :transform="`translate(${(x - y) * 0.75} ${(x + y) * 0.4 - z})`">
    <polygon :points="points.left" fill="var(--block-left, var(--strong))" />
    <polygon :points="points.right" fill="var(--block-right, var(--orange))" />
    <polygon :points="points.top" fill="var(--block-top, var(--peach))" />
  </g>
</template>
