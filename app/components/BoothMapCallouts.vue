<script setup lang="ts">
import { layoutBoothMapCallouts, type BoothMapCalloutAnchor } from '~/utils/boothMapCalloutLayout'

type CalloutItem = {
  id: string
  title: string
  description: string
  actionLabel: string
  disabled: boolean
  countLabel?: string
}

const props = defineProps<{
  items: readonly CalloutItem[]
  anchors: readonly BoothMapCalloutAnchor[]
  width: number
  height: number
  visible: boolean
  reducedMotion: boolean
}>()
defineEmits<{ select: [id: string] }>()

const callouts = computed(() => {
  if (props.width <= 0 || props.height <= 0) return []
  const itemsById = new Map(props.items.map((item) => [item.id, item]))
  const anchors = props.anchors.filter((anchor) => itemsById.has(anchor.id))
  return layoutBoothMapCallouts(anchors, { width: props.width, height: props.height }).map(
    (placement) => ({ ...placement, item: itemsById.get(placement.id)! }),
  )
})
</script>

<template>
  <div
    v-if="visible && callouts.length"
    class="booth-callouts"
    :class="{ 'reduced-motion': reducedMotion }"
  >
    <svg
      class="callout-connectors"
      :viewBox="`0 0 ${width} ${height}`"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <g
        v-for="(callout, index) in callouts"
        :key="callout.id"
        :style="{ '--callout-delay': `${index * 8}ms` }"
      >
        <path
          class="callout-stem"
          :d="`M${callout.anchorX},${callout.anchorY} L${callout.edgeX},${callout.edgeY}`"
          pathLength="1"
        />
        <circle class="callout-anchor" :cx="callout.anchorX" :cy="callout.anchorY" r="3.5" />
      </g>
    </svg>

    <button
      v-for="(callout, index) in callouts"
      :key="callout.id"
      type="button"
      class="callout-card"
      :data-callout-id="callout.id"
      :style="{
        left: `${callout.x}px`,
        top: `${callout.y}px`,
        width: `${callout.width}px`,
        height: `${callout.height}px`,
        '--callout-delay': `${index * 8}ms`,
      }"
      :disabled="callout.item.disabled"
      :aria-label="callout.item.actionLabel || callout.item.title"
      @click="$emit('select', callout.id)"
    >
      <span class="callout-heading">
        <strong class="callout-title">{{ callout.item.title }}</strong>
        <span v-if="callout.item.countLabel" class="callout-count">
          {{ callout.item.countLabel }}
        </span>
        <span v-else-if="!callout.item.disabled" class="callout-arrow" aria-hidden="true">›</span>
      </span>
      <span class="callout-description">{{ callout.item.description }}</span>
    </button>
  </div>
</template>

<style scoped>
.booth-callouts {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}
.callout-connectors {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.callout-stem {
  fill: none;
  stroke: var(--muted);
  stroke-width: 1.2;
  stroke-linecap: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 0;
  animation: stem-grow 360ms calc(80ms + var(--callout-delay)) ease-out both;
}
.callout-anchor {
  fill: var(--orange);
  stroke: var(--white);
  stroke-width: 1.5;
  transform-box: fill-box;
  transform-origin: center;
  animation: anchor-appear 80ms var(--callout-delay) ease-out both;
}
.callout-card {
  position: absolute;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 13px;
  background: var(--glass);
  box-shadow: 0 2px 5px var(--navigation-shadow);
  color: var(--ink);
  text-align: left;
  pointer-events: auto;
  animation: card-appear 160ms calc(440ms + var(--callout-delay)) ease-out both;
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease;
}
.callout-card:hover:not(:disabled),
.callout-card:focus-visible {
  border-color: var(--orange);
  box-shadow: 0 2px 8px var(--dialog-shadow);
}
.callout-card:disabled {
  cursor: default;
  opacity: 1;
}
.callout-heading {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}
.callout-title,
.callout-description {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
}
.callout-title {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  line-height: 1.35;
}
.callout-count {
  flex: none;
  color: var(--muted);
  font-size: 9px;
  line-height: 1.4;
  white-space: nowrap;
}
.callout-arrow {
  flex: none;
  color: var(--muted);
  font-size: 17px;
  line-height: 1;
}
.callout-description {
  color: var(--muted);
  font-size: 11px;
  line-height: 1.5;
}
.reduced-motion .callout-stem,
.reduced-motion .callout-anchor,
.reduced-motion .callout-card {
  animation: none;
}
@keyframes anchor-appear {
  from {
    opacity: 0;
    transform: scale(0.6);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
@keyframes stem-grow {
  from {
    stroke-dashoffset: 1;
  }
  to {
    stroke-dashoffset: 0;
  }
}
@keyframes card-appear {
  from {
    visibility: hidden;
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    visibility: visible;
    opacity: 1;
    transform: translateY(0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .callout-stem,
  .callout-anchor,
  .callout-card {
    animation: none;
    transition: none;
  }
}
</style>
