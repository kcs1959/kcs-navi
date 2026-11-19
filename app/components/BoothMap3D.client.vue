<script setup lang="ts">
import * as THREE from 'three'
import type { DeskKey } from '~~/shared/types'
import {
  createBoothDesk,
  createBoothVisitor,
  createBoothWhiteboard,
  type BoothModelMaterials,
} from '~/utils/boothMapModels'

// 展示説明は次の段階で接続する。既存マップと同じデータ・選択イベントを受け継ぐ。
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
const emit = defineEmits<{ select: [key: DeskKey]; ready: [] }>()

const viewport = useTemplateRef('viewport')
const webglFailed = ref(false)
const { theme } = useTheme()

// 写真の、横長の床と奥・左の2面の壁。寸法・カメラはここで調整する。
const roomSize = { width: 12, depth: 7.5, height: 3.2, thickness: 0.16 }
const intro = { duration: 1000, rotation: -Math.PI * 0.7, scale: 0.68 }
const drop = { delay: 100, duration: 720, height: 3.6 }
const deskPlacements = [
  ...[-4.6, -2.3, 0, 2.3, 4.6].map((x, index) => ({
    id: `wall-desk-${index + 1}`,
    x,
    z: -2.75,
    rotation: 0,
  })),
  // 左壁パネルの左隣（壁に沿って手前側）。長辺を左壁と平行にする。
  { id: 'panel-side-desk', x: -4.95, z: 2.3, rotation: Math.PI / 2 },
]
const visitorPlacement = { x: roomSize.width / 2 - 2, z: roomSize.depth / 2 - 3 }
const boardPlacement = { x: -0.9, z: 1.35 }

let renderer: THREE.WebGLRenderer | undefined
let scene: THREE.Scene | undefined
let resizeObserver: ResizeObserver | undefined
let motionPreference: MediaQueryList | undefined
let finishIntro: (() => void) | undefined
let stopThemeWatch: (() => void) | undefined

function disposeScene() {
  resizeObserver?.disconnect()
  motionPreference?.removeEventListener('change', onMotionChange)
  stopThemeWatch?.()
  renderer?.setAnimationLoop(null)
  renderer?.domElement.removeEventListener('webglcontextlost', onContextLost)

  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.Material>()
  const textures = new Set<THREE.Texture>()
  scene?.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    geometries.add(object.geometry)
    const objectMaterials = Array.isArray(object.material) ? object.material : [object.material]
    objectMaterials.forEach((material) => {
      materials.add(material)
      if ('map' in material && material.map instanceof THREE.Texture) textures.add(material.map)
    })
  })
  geometries.forEach((geometry) => geometry.dispose())
  materials.forEach((material) => material.dispose())
  textures.forEach((texture) => texture.dispose())
  renderer?.dispose()
  renderer?.domElement.remove()
}

function onContextLost(event: Event) {
  event.preventDefault()
  renderer?.setAnimationLoop(null)
  webglFailed.value = true
}

function onMotionChange(event: MediaQueryListEvent) {
  if (event.matches) finishIntro?.()
}

onMounted(async () => {
  // Nuxtの.clientコンポーネントはマウント後の更新でテンプレートを描画する。
  await nextTick()
  const host = viewport.value
  if (!host) return

  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    const view = renderer
    view.setClearColor(0x000000, 0)
    view.outputColorSpace = THREE.SRGBColorSpace
    view.toneMapping = THREE.ACESFilmicToneMapping
    view.domElement.setAttribute('aria-hidden', 'true')
    view.domElement.addEventListener('webglcontextlost', onContextLost)
    host.append(view.domElement)

    scene = new THREE.Scene()
    const world = scene
    const room = new THREE.Group()
    room.name = 'booth-room'
    world.add(room)

    const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 100)
    camera.position.set(13, 12, 16)
    camera.lookAt(0, roomSize.height / 2, 0)
    camera.updateMatrixWorld()

    world.add(new THREE.AmbientLight(0xffffff, 1.9))
    const sunlight = new THREE.DirectionalLight(0xfff2df, 2.4)
    sunlight.position.set(4, 10, 7)
    world.add(sunlight)

    const themedMaterials: { material: THREE.MeshStandardMaterial; token: string }[] = []
    function material(token: string) {
      const surface = new THREE.MeshStandardMaterial({ roughness: 0.9 })
      themedMaterials.push({ material: surface, token })
      return surface
    }
    const floorMaterial = material('--paper')
    const wallMaterial = material('--peach')
    const trimMaterial = material('--strong')
    const boardFrameMaterial = material('--muted')
    const boardMaterial = material('--glass')
    const furnitureMaterials: BoothModelMaterials = {
      tabletop: material('--peach'),
      frame: material('--muted'),
      board: boardMaterial,
      skin: new THREE.MeshStandardMaterial({ color: '#f2c4a0', roughness: 0.9 }),
      hair: new THREE.MeshStandardMaterial({ color: '#49372e', roughness: 0.9 }),
      shirt: material('--orange'),
      trousers: new THREE.MeshStandardMaterial({ color: '#536575', roughness: 0.9 }),
      phone: new THREE.MeshStandardMaterial({ color: '#353a41', roughness: 0.8 }),
    }

    function box(
      width: number,
      height: number,
      depth: number,
      x: number,
      y: number,
      z: number,
      surface: THREE.MeshStandardMaterial,
    ) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), surface)
      mesh.position.set(x, y, z)
      room.add(mesh)
      return mesh
    }

    const { width, depth, height, thickness } = roomSize
    box(width, thickness, depth, 0, -thickness / 2, 0, floorMaterial)
    box(width, height, thickness, 0, height / 2, -depth / 2, wallMaterial)
    box(thickness, height, depth, -width / 2, height / 2, 0, wallMaterial)
    // 壁の上端と巾木で、教室の外形と床面を読み取りやすくする。
    box(width + thickness, 0.07, thickness + 0.04, 0, height, -depth / 2, trimMaterial)
    box(thickness + 0.04, 0.07, depth, -width / 2, height, 0, trimMaterial)
    box(width, 0.12, 0.04, 0, 0.06, -depth / 2 + thickness / 2 + 0.02, trimMaterial)
    box(0.04, 0.12, depth, -width / 2 + thickness / 2 + 0.02, 0.06, 0, trimMaterial)

    // 左壁の白いパネルをホワイトボードとして残す。
    const panelX = -width / 2 + thickness / 2
    box(0.09, 1.95, 3.3, panelX + 0.05, 1.9, -0.55, boardFrameMaterial)
    box(0.035, 1.77, 3.12, panelX + 0.11, 1.9, -0.55, boardMaterial).name = 'wall-whiteboard'

    // 配置はDBの3机とは独立。回転中は隠し、完成姿勢のまま真下に降ろす。
    const furnishings: THREE.Group[] = deskPlacements.map(({ id, x, z, rotation }) => {
      const desk = createBoothDesk(furnitureMaterials)
      desk.name = id
      desk.position.set(x, 0, z)
      desk.rotation.y = rotation
      return desk
    })
    const board = createBoothWhiteboard(furnitureMaterials)
    board.position.set(boardPlacement.x, 0, boardPlacement.z)
    board.rotation.y = (Math.PI / 2) 
    furnishings.push(board) 
    const visitor = createBoothVisitor(furnitureMaterials)
    visitor.position.set(visitorPlacement.x, 0, visitorPlacement.z)
    visitor.rotation.y = -Math.PI / 7
    furnishings.push(visitor)
    room.add(...furnishings)

    const shadowMaterial = material('--ink')
    shadowMaterial.transparent = true
    shadowMaterial.opacity = 0.08
    shadowMaterial.depthWrite = false
    const shadows = furnishings.map((furnishing) => {
      const shadow = new THREE.Mesh(new THREE.CircleGeometry(1, 32), shadowMaterial)
      shadow.rotation.x = -Math.PI / 2
      shadow.position.set(furnishing.position.x, 0.01, furnishing.position.z)
      const isVisitor = furnishing === visitor
      shadow.scale.set(isVisitor ? 0.42 : 0.95, isVisitor ? 0.3 : 0.47, 1)
      room.add(shadow)
      return shadow
    })

    function applyPalette() {
      const styles = getComputedStyle(host!)
      themedMaterials.forEach(({ material: surface, token }) => {
        surface.color.set(styles.getPropertyValue(token).trim())
      })
      view.render(world, camera)
    }

    // 最終位置の境界をカメラ座標で測る。縦長画面でも床と壁が切れない画角にする。
    const bounds = new THREE.Box3().setFromObject(room)
    const cameraBounds = new THREE.Box3()
    for (const x of [bounds.min.x, bounds.max.x]) {
      for (const y of [bounds.min.y, bounds.max.y]) {
        for (const z of [bounds.min.z, bounds.max.z]) {
          cameraBounds.expandByPoint(
            new THREE.Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse),
          )
        }
      }
    }
    const projectedSize = cameraBounds.getSize(new THREE.Vector3())
    const projectedCenter = cameraBounds.getCenter(new THREE.Vector3())
    function resize() {
      const { width: hostWidth, height: hostHeight } = host!.getBoundingClientRect()
      if (!hostWidth || !hostHeight) return
      const aspect = hostWidth / hostHeight
      const halfHeight = Math.max(projectedSize.y / 2, projectedSize.x / (2 * aspect)) * 1.13
      camera.left = projectedCenter.x - halfHeight * aspect
      camera.right = projectedCenter.x + halfHeight * aspect
      camera.top = projectedCenter.y + halfHeight
      camera.bottom = projectedCenter.y - halfHeight
      camera.updateProjectionMatrix()
      view.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      view.setSize(hostWidth, hostHeight)
      view.render(world, camera)
    }

    finishIntro = () => {
      room.rotation.y = 0
      room.scale.setScalar(1)
      furnishings.forEach((furnishing) => {
        furnishing.visible = true
        furnishing.position.y = 0
      })
      shadows.forEach((shadow) => (shadow.visible = true))
      shadowMaterial.opacity = 0.08
      view.setAnimationLoop(null)
      view.render(world, camera)
    }
    motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    motionPreference.addEventListener('change', onMotionChange)
    applyPalette()
    resize()
    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(host)
    stopThemeWatch = watch(theme, applyPalette, { flush: 'post' })

    if (motionPreference.matches) {
      finishIntro()
    } else {
      furnishings.forEach((furnishing) => {
        furnishing.visible = false
        furnishing.position.y = drop.height
      })
      shadows.forEach((shadow) => (shadow.visible = false))
      room.rotation.y = intro.rotation
      room.scale.setScalar(intro.scale)
      view.render(world, camera)
      let start: number | undefined
      view.setAnimationLoop((time) => {
        start ??= time
        const elapsed = time - start
        const progress = Math.min(elapsed / intro.duration, 1)
        const eased = 1 - (1 - progress) ** 3
        room.rotation.y = intro.rotation * (1 - eased)
        room.scale.setScalar(intro.scale + (1 - intro.scale) * eased)
        const dropElapsed = elapsed - intro.duration - drop.delay
        if (dropElapsed >= 0) {
          const falling = Math.min(dropElapsed / drop.duration, 1)
          // 前半は加速して落下、着地後は小さく一度だけ跳ねて止まる。
          const lift =
            falling < 0.8
              ? drop.height * (1 - (falling / 0.8) ** 2)
              : Math.sin(((falling - 0.8) / 0.2) * Math.PI) * 0.12
          furnishings.forEach((furnishing) => {
            furnishing.visible = true
            furnishing.position.y = lift
          })
          shadows.forEach((shadow) => (shadow.visible = true))
          shadowMaterial.opacity = 0.08 * (0.25 + 0.75 * (1 - lift / drop.height))
          if (falling === 1) {
            finishIntro?.()
            return
          }
        }
        view.render(world, camera)
      })
    }
    emit('ready')
  } catch {
    disposeScene()
    webglFailed.value = true
    emit('ready')
  }
})

onBeforeUnmount(disposeScene)
</script>

<template>
  <div class="room-map-3d">
    <div
      v-show="!webglFailed"
      ref="viewport"
      class="room-viewport"
      role="img"
      aria-label="教室の3D全体図。長い壁沿いに机5台、左壁のホワイトボードの左隣に机1台、手前に自立式ボードがあり、入口にはスマホを持つ人が立っています。"
    />
    <BoothMapFallback
      v-if="webglFailed"
      :desks="deskPlacements"
      :visitor="visitorPlacement"
      :board="boardPlacement"
    />
  </div>
</template>

<style scoped>
.room-map-3d {
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 1040px;
  margin-inline: auto;
  overflow: hidden;
  border-radius: 20px;
  background: var(--glass);
}
.room-viewport {
  width: 100%;
  height: 100%;
}
.room-viewport :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
