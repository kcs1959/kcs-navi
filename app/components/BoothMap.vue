<script setup lang="ts">
import type { DeskKey } from '~~/shared/types'

defineProps<{
  desks: {
    key: DeskKey
    number: string
    letter: string
    label: string
    count: number | null
    countLabel: string
    titles: string
  }[]
}>()
defineEmits<{ select: [key: DeskKey] }>()

const symbolId = useId()
// リリース時の固定配置。机の移動はこの座標だけで調整する。
const positions: Record<DeskKey, { x: number; y: number }> = {
  'desk-a': { x: 60, y: 240 },
  'desk-b': { x: 235, y: 30 },
  'desk-c': { x: 270, y: 275 },
}
const tableLegs = [
  [8, 8],
  [116, 8],
  [8, 52],
  [116, 52],
] as const
const chairLegs = [
  [0, 0],
  [30, 0],
  [0, 28],
  [30, 28],
] as const
function labelPosition(key: DeskKey) {
  const { x, y } = positions[key]
  return {
    left: `${((330 + (x + 66 - y - 34) * 0.75) / 720) * 100}%`,
    top: `${((210 + (x + 66 + y + 34) * 0.4 - 68 - (key === 'desk-c' ? 0 : 110)) / 590) * 100}%`,
  }
}
</script>

<template>
  <div class="room-map">
    <svg class="room" viewBox="0 0 720 590" aria-hidden="true" focusable="false">
      <defs>
        <g :id="`${symbolId}-chair`">
          <BoothMapBlock
            v-for="[x, y] in chairLegs"
            :key="`${x}-${y}`"
            class="furniture-frame"
            :x="x"
            :y="y"
            :width="6"
            :depth="6"
            :height="28"
          />
          <BoothMapBlock :z="28" :width="38" :depth="36" :height="6" />
          <BoothMapBlock :y="30" :z="34" :width="38" :depth="6" :height="32" />
        </g>
        <g :id="`${symbolId}-desk`">
          <path d="M0 3 112 63 48 101 -64 41Z" fill="var(--ink)" opacity=".07" />
          <BoothMapBlock
            v-for="[x, y] in tableLegs"
            :key="`${x}-${y}`"
            class="furniture-frame"
            :x="x"
            :y="y"
            :width="8"
            :depth="8"
            :height="60"
          />
          <BoothMapBlock :z="60" :width="132" :depth="68" :height="8" />
          <use :href="`#${symbolId}-chair`" transform="translate(-28.5 53.6)" />
        </g>
      </defs>

      <ellipse cx="352" cy="490" rx="258" ry="65" fill="var(--ink)" opacity=".05" />
      <g transform="translate(330 210)">
        <BoothMapBlock
          class="floor"
          :x="-10"
          :y="-10"
          :z="-14"
          :width="460"
          :depth="420"
          :height="14"
        />
        <BoothMapBlock
          class="wall wall-left"
          :x="-10"
          :y="-10"
          :width="12"
          :depth="420"
          :height="170"
        />
        <BoothMapBlock
          class="wall wall-right"
          :x="2"
          :y="-10"
          :width="448"
          :depth="12"
          :height="170"
        />
        <g transform="matrix(-.75 .4 0 1 1.5 .8)">
          <rect class="board-frame" x="65" y="-140" width="235" height="88" rx="3" />
          <rect class="board" x="72" y="-133" width="221" height="74" rx="1" />
          <path d="M94-79H160M94-70H136" stroke="var(--paper)" stroke-width="3" opacity=".6" />
        </g>
        <g transform="matrix(.75 .4 0 1 -1.5 .8)">
          <g v-for="x in [85, 210, 335]" :key="x" :transform="`translate(${x} -142)`">
            <rect class="window-frame" width="72" height="106" rx="2" />
            <path class="window-pane" d="M7 7H65V99H7Z" />
            <path d="M36 7V99M7 53H65" stroke="var(--peach)" stroke-width="5" />
          </g>
        </g>
        <g
          v-for="desk in desks"
          :key="desk.key"
          :transform="`translate(${(positions[desk.key].x - positions[desk.key].y) * 0.75} ${(positions[desk.key].x + positions[desk.key].y) * 0.4})`"
        >
          <use
            :href="`#${symbolId}-desk`"
            :class="{ 'desk-model': desk.count }"
            @click="desk.count && $emit('select', desk.key)"
          />
          <path
            v-if="desk.key !== 'desk-c'"
            d="M24-138V-42"
            stroke="var(--muted)"
            stroke-width="1.5"
            opacity=".5"
          />
        </g>
      </g>
      <g class="wayfinding" fill="var(--muted)" text-anchor="middle">
        <text x="115" y="477">入口 ↗</text>
        <text x="577" y="501">出口 ↗</text>
      </g>
    </svg>

    <button
      v-for="desk in desks"
      :key="desk.key"
      type="button"
      class="desk"
      :style="labelPosition(desk.key)"
      :disabled="!desk.count"
      :aria-label="`${desk.label}、展示机${desk.letter}、${desk.countLabel}${desk.titles ? `：${desk.titles}の詳細を見る` : ''}`"
      @click="$emit('select', desk.key)"
    >
      <span class="desk-label">{{ desk.label }}</span>
      <span class="desk-count">{{ desk.number }} · {{ desk.countLabel }}</span>
    </button>
  </div>
</template>

<style scoped>
.room-map {
  position: relative;
  isolation: isolate;
  max-width: 560px;
  margin-inline: auto;
  border-radius: 20px;
  background: var(--glass);
}
.room {
  display: block;
  width: 100%;
  height: auto;
}
.floor {
  --block-top: var(--paper);
  --block-left: var(--peach);
  --block-right: var(--strong);
}
.wall {
  --block-top: var(--glass);
  --block-right: var(--strong);
}
.wall-left {
  --block-left: var(--peach);
}
.wall-right {
  --block-left: color-mix(in srgb, var(--peach) 65%, var(--glass));
}
.furniture-frame {
  --block-top: var(--strong);
  --block-left: color-mix(in srgb, var(--orange) 75%, var(--muted));
  --block-right: color-mix(in srgb, var(--orange) 65%, var(--ink));
}
.board-frame,
.window-frame {
  fill: var(--strong);
}
.board {
  fill: var(--muted);
}
.window-pane {
  fill: var(--glass);
}
.wayfinding {
  font-size: 20px;
  font-weight: 500;
}
.desk-model {
  cursor: pointer;
}
.desk {
  position: absolute;
  width: 30%;
  min-height: 44px;
  padding: 6px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  transform: translate(-50%, -100%);
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--glass);
  box-shadow: 0 3px 0 var(--peach);
  transition:
    translate 0.15s,
    border-color 0.15s;
}
.desk:hover:not(:disabled),
.desk:focus-visible {
  border-color: var(--orange);
  translate: 0 -3px;
}
.desk:active:not(:disabled) {
  translate: 0 1px;
}
.desk:disabled {
  cursor: default;
}
.desk-label {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-width: 100%;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.4;
  overflow-wrap: anywhere;
}
.desk-count {
  color: var(--muted);
  font-size: 9px;
  line-height: 1.5;
}
</style>
