<script setup lang="ts">
import * as THREE from 'three'
import type { DeskKey } from '~~/shared/types'

// 展示物は次の段階で追加する。既存マップと同じデータ・選択イベントを受け継ぐ。
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
const intro = { duration: 2000, rotation: -Math.PI * 0.7, scale: 0.68 }

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
    const screenFrameMaterial = material('--muted')
    const screenMaterial = material('--glass')

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

    // 左壁のPVスクリーン。動画や作品データにはまだ接続しない。
    const screenX = -width / 2 + thickness / 2
    box(0.09, 1.95, 3.3, screenX + 0.05, 1.9, -0.55, screenFrameMaterial)
    box(0.035, 1.77, 3.12, screenX + 0.11, 1.9, -0.55, screenMaterial)

    const labelCanvas = document.createElement('canvas')
    labelCanvas.width = 640
    labelCanvas.height = 360
    const labelContext = labelCanvas.getContext('2d')
    if (!labelContext) throw new Error('PV screen canvas is unavailable')
    const labelTexture = new THREE.CanvasTexture(labelCanvas)
    labelTexture.colorSpace = THREE.SRGBColorSpace
    const labelMaterial = new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true })
    const label = new THREE.Mesh(new THREE.PlaneGeometry(2.95, 1.66), labelMaterial)
    label.rotation.y = Math.PI / 2
    label.position.set(screenX + 0.132, 1.9, -0.55)
    room.add(label)

    function applyPalette() {
      const styles = getComputedStyle(host!)
      themedMaterials.forEach(({ material: surface, token }) => {
        surface.color.set(styles.getPropertyValue(token).trim())
      })
      labelContext!.clearRect(0, 0, labelCanvas.width, labelCanvas.height)
      labelContext!.fillStyle = styles.getPropertyValue('--muted').trim()
      labelContext!.textAlign = 'center'
      labelContext!.textBaseline = 'middle'
      labelContext!.font = '500 72px sans-serif'
      labelContext!.fillText('PV', 320, 180)
      labelTexture.needsUpdate = true
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
      room.rotation.y = intro.rotation
      room.scale.setScalar(intro.scale)
      view.render(world, camera)
      let start: number | undefined
      view.setAnimationLoop((time) => {
        start ??= time
        const progress = Math.min((time - start) / intro.duration, 1)
        const eased = 1 - (1 - progress) ** 3
        room.rotation.y = intro.rotation * (1 - eased)
        room.scale.setScalar(intro.scale + (1 - intro.scale) * eased)
        view.render(world, camera)
        // 導入後は描画ループを停止し、リサイズ・テーマ変更時のみ再描画する。
        if (progress === 1) finishIntro?.()
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
      aria-label="横長の教室の3D全体図。奥と左に壁があり、左壁にPVスクリーンがあります。"
    />
    <div v-if="webglFailed" class="room-fallback">
      <svg
        viewBox="0 0 720 500"
        role="img"
        aria-label="教室の全体図。奥と左に壁があり、左壁にPVスクリーンがあります。"
      >
        <path class="fallback-floor-edge" d="m68 282 382 164 202-126v14L450 460 68 296Z" />
        <path class="fallback-floor" d="m68 282 202-126 382 164-202 126Z" />
        <path class="fallback-wall" d="M68 282V146L270 20v136Zm202-126V20l382 164v136Z" />
        <path class="fallback-trim" d="M68 146 270 20l382 164M68 282l202-126 382 164" />
        <path class="fallback-frame" d="m123 150 99-61v74l-99 61Z" />
        <path class="fallback-screen" d="m130 153 85-52v58l-85 52Z" />
      </svg>
      <p role="status">3D表示を利用できないため、全体図を表示しています。</p>
    </div>
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
.room-viewport,
.room-fallback {
  width: 100%;
  height: 100%;
}
.room-viewport :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}
.room-fallback {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 16px;
}
.room-fallback svg {
  display: block;
  width: 100%;
  min-height: 0;
}
.room-fallback p {
  color: var(--muted);
  font-size: 11px;
  line-height: 1.7;
  text-align: center;
}
.fallback-floor {
  fill: var(--paper);
}
.fallback-wall {
  fill: var(--peach);
}
.fallback-floor-edge {
  fill: var(--strong);
}
.fallback-trim {
  fill: none;
  stroke: var(--strong);
  stroke-width: 5;
  stroke-linejoin: round;
}
.fallback-frame {
  fill: var(--muted);
}
.fallback-screen {
  fill: var(--glass);
}
.fallback-label {
  fill: var(--muted);
  font-size: 24px;
  font-weight: 500;
}
</style>
