<script setup lang="ts">
type Position = { x: number; z: number }
type DeskPlacement = Position & { id: string; rotation: number }
type BoardPlacement = Position & { rotation?: number }
type Point = readonly [number, number, number]

const props = defineProps<{
  desks: DeskPlacement[]
  visitor: Position
  board: BoardPlacement
}>()

function project(x: number, y: number, z: number) {
  return {
    x: 360 + (x * 382) / 12 - (z * 202) / 7.5,
    y: 301 + (x * 164) / 12 + (z * 126) / 7.5 - (y * 136) / 3.2,
  }
}
function point(x: number, y: number, z: number) {
  const projected = project(x, y, z)
  return `${projected.x},${projected.y}`
}
function at(position: Position) {
  const projected = project(position.x, 0, position.z)
  return `translate(${projected.x} ${projected.y})`
}
function localPoint(position: Position, x: number, y: number, z: number, rotation = 0) {
  return point(
    position.x + x * Math.cos(rotation) + z * Math.sin(rotation),
    y,
    position.z - x * Math.sin(rotation) + z * Math.cos(rotation),
  )
}
function deskPolygon(desk: DeskPlacement, points: readonly Point[]) {
  return points.map(([x, y, z]) => localPoint(desk, x, y, z, desk.rotation)).join(' ')
}
function boardPolygon(board: BoardPlacement, points: readonly Point[]) {
  return points.map(([x, y, z]) => localPoint(board, x, y, z, board.rotation ?? 0)).join(' ')
}

const corners = [
  [-0.825, -0.425],
  [0.825, -0.425],
  [0.825, 0.425],
  [-0.825, 0.425],
] as const
const tabletop = corners.map(([x, z]): Point => [x, 0.88, z])
const deskSides = corners.map(([x, z], index): Point[] => {
  const [nextX, nextZ] = corners[(index + 1) % corners.length]!
  return [
    [x, 0.78, z],
    [nextX, 0.78, nextZ],
    [nextX, 0.88, nextZ],
    [x, 0.88, z],
  ]
})
const legs = [
  [-0.69, -0.31],
  [0.69, -0.31],
  [-0.69, 0.31],
  [0.69, 0.31],
] as const
const boardFrame: Point[] = [
  [-0.61, 0.78, 0],
  [0.61, 0.78, 0],
  [0.61, 2.63, 0],
  [-0.61, 2.63, 0],
]
const boardSurface: Point[] = [
  [-0.555, 0.835, 0.06],
  [0.555, 0.835, 0.06],
  [0.555, 2.575, 0.06],
  [-0.555, 2.575, 0.06],
]
const items = computed(() =>
  [
    ...props.desks.map((desk) => ({ ...desk, kind: 'desk' as const })),
    { ...props.board, id: 'whiteboard', kind: 'board' as const },
    { ...props.visitor, id: 'entrance-visitor', kind: 'visitor' as const },
  ].sort((a, b) => project(a.x, 0, a.z).y - project(b.x, 0, b.z).y),
)
</script>

<template>
  <div class="room-fallback">
    <svg
      viewBox="0 0 720 500"
      role="img"
      aria-label="教室の全体図。奥と左に壁があり、長い壁沿いに机5台、左壁の白いパネルの左隣に机1台。手前に自立式ボードと、入口でスマホを持つ人がいます。"
    >
      <path class="floor-edge" d="m68 282 382 164 202-126v14L450 460 68 296Z" />
      <path class="floor" d="m68 282 202-126 382 164-202 126Z" />
      <path class="wall" d="M68 282V146L270 20v136Zm202-126V20l382 164v136Z" />
      <path class="trim" d="M68 146 270 20l382 164M68 282l202-126 382 164" />
      <path class="frame" d="m123 150 99-61v74l-99 61Z" />
      <path class="screen" d="m130 153 85-52v58l-85 52Z" />

      <g v-for="item in items" :key="item.id" :data-model="item.kind">
        <g v-if="item.kind === 'desk'">
          <polyline
            v-for="[x, z] in legs"
            :key="`${x}-${z}`"
            class="desk-leg"
            :points="
              deskPolygon(item, [
                [x, 0, z],
                [x, 0.78, z],
              ])
            "
          />
          <polygon
            v-for="(side, index) in deskSides"
            :key="index"
            class="table-side"
            :points="deskPolygon(item, side)"
          />
          <polygon class="table-top" :points="deskPolygon(item, tabletop)" />
        </g>
        <g v-else-if="item.kind === 'board'">
          <polygon
            class="frame"
            :points="
              boardPolygon(item, [
                [-0.61, 0.065, -0.20],
                [0.61, 0.065, -0.20],
                [0.61, 0.065, 0.20],
                [-0.61, 0.065, 0.20],
              ])
            "
          />
          <polyline
            class="board-post"
            :points="
              boardPolygon(item, [
                [0, 0.065, 0],
                [0, 0.965, 0],
              ])
            "
          />
          <polygon class="frame" :points="boardPolygon(item, boardFrame)" />
          <polygon class="board-surface" :points="boardPolygon(item, boardSurface)" />
          <polyline
            class="board-leg"
            :points="
              boardPolygon(item, [
                [-0.545, 0.79, 0.1],
                [0.545, 0.79, 0.1],
              ])
            "
          />
        </g>
        <g v-else :transform="at(item)">
          <ellipse class="visitor-shadow" cx="0" cy="-1" rx="15" ry="5" />
          <path class="trousers" d="m-9-30 19-2 3 27-8 1-5-20-3 23-8-1Z" />
          <path class="hair" d="m-12-6 9 1v6h-15v-4Zm17 0 9-1 5 5v3H5Z" />
          <path class="shirt" d="M-7-57q12-3 16 8l2 23-21 1-3-20Z" />
          <path class="skin" d="m-8-57 5-3 5 7-8 2Z" />
          <ellipse class="skin" cx="-4" cy="-65" rx="9" ry="10" />
          <path class="hair" d="M-13-64q-3-13 8-13 13-1 13 14l-6-1-3-6-6 5Z" />
          <path class="skin" d="m-12-65-4 4 5 2Z" />
          <circle class="hair" cx="-10" cy="-65" r="1.1" />
          <path class="arm" d="m7-49-1 12-14-6M-9-48l-5 11-7-8" />
          <rect
            class="phone"
            x="-24"
            y="-55"
            width="11"
            height="19"
            rx="2"
            transform="rotate(-12 -19 -45)"
          />
          <circle class="skin" cx="-14" cy="-44" r="3" />
        </g>
      </g>
    </svg>
    <p role="status">3D表示を利用できないため、全体図を表示しています。</p>
  </div>
</template>

<style scoped>
.room-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 16px;
}
svg {
  display: block;
  width: 100%;
  min-height: 0;
}
p {
  color: var(--muted);
  font-size: 11px;
  line-height: 1.7;
  text-align: center;
}
.floor {
  fill: var(--paper);
}
.floor-edge,
.table-side {
  fill: var(--strong);
}
.wall,
.skin {
  fill: var(--peach);
}
.trim {
  fill: none;
  stroke: var(--strong);
  stroke-width: 5;
  stroke-linejoin: round;
}
.frame,
.trousers {
  fill: var(--muted);
}
.screen {
  fill: var(--glass);
}
.desk-leg,
.board-leg,
.board-post {
  fill: none;
  stroke: var(--muted);
  stroke-width: 3;
  stroke-linecap: round;
}
.board-post {
  stroke-width: 3.5;
}
.table-top {
  fill: var(--lemon);
}
.table-top,
.table-side {
  stroke: var(--muted);
  stroke-width: 1;
  stroke-linejoin: round;
}
.board-surface {
  fill: var(--white);
}
.visitor-shadow {
  fill: var(--ink);
  opacity: 0.08;
}
.hair,
.phone {
  fill: var(--ink);
}
.shirt {
  fill: var(--orange);
}
.arm {
  fill: none;
  stroke: var(--peach);
  stroke-width: 5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.phone-screen {
  fill: var(--mint);
}
</style>
