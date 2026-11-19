import * as THREE from 'three'

export type BoothModelMaterials = {
  tabletop: THREE.Material
  frame: THREE.Material
  board: THREE.Material
  skin: THREE.Material
  hair: THREE.Material
  shirt: THREE.Material
  trousers: THREE.Material
  phone: THREE.Material
}

function addMesh(
  group: THREE.Group,
  name: string,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
) {
  const mesh = new THREE.Mesh(geometry, material)
  mesh.name = name
  mesh.position.set(x, y, z)
  group.add(mesh)
  return mesh
}

function addBox(
  group: THREE.Group,
  name: string,
  material: THREE.Material,
  size: [number, number, number],
  position: [number, number, number],
) {
  return addMesh(group, name, new THREE.BoxGeometry(...size), material, ...position)
}

function addLimb(
  group: THREE.Group,
  name: string,
  material: THREE.Material,
  start: [number, number, number],
  end: [number, number, number],
  radius: number,
) {
  const from = new THREE.Vector3(...start)
  const to = new THREE.Vector3(...end)
  const direction = to.clone().sub(from)
  const middle = from.clone().add(to).multiplyScalar(0.5)
  const limb = addMesh(
    group,
    name,
    new THREE.CylinderGeometry(radius, radius, direction.length(), 10),
    material,
    middle.x,
    middle.y,
    middle.z,
  )
  limb.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize())
}

/** 床をy=0にした展示机。幅1.65、奥行0.85、天板上面0.88。 */
export function createBoothDesk(materials: BoothModelMaterials): THREE.Group {
  const desk = new THREE.Group()
  desk.name = 'exhibition-desk'
  addBox(desk, 'tabletop', materials.tabletop, [1.65, 0.1, 0.85], [0, 0.83, 0])
  for (const [side, x] of [
    ['left', -0.69],
    ['right', 0.69],
  ] as const) {
    for (const [end, z] of [
      ['back', -0.31],
      ['front', 0.31],
    ] as const) {
      addBox(desk, `${side}-${end}-leg`, materials.frame, [0.075, 0.78, 0.075], [x, 0.39, z])
    }
    addBox(desk, `${side}-apron`, materials.frame, [0.075, 0.1, 0.64], [x, 0.73, 0])
  }
  addBox(desk, 'back-apron', materials.frame, [1.38, 0.1, 0.075], [0, 0.73, -0.31])
  return desk
}

/** +zを向き、胸の前で両手にスマホを持つ人物。全高は約1.78。 */
export function createBoothVisitor(materials: BoothModelMaterials): THREE.Group {
  const visitor = new THREE.Group()
  visitor.name = 'entrance-visitor'

  for (const [side, x] of [
    ['left', -0.115],
    ['right', 0.115],
  ] as const) {
    addBox(visitor, `${side}-shoe`, materials.hair, [0.18, 0.1, 0.29], [x, 0.05, 0.055])
    addMesh(
      visitor,
      `${side}-leg`,
      new THREE.CapsuleGeometry(0.085, 0.34, 4, 10),
      materials.trousers,
      x,
      0.34,
      0,
    )
  }
  addBox(visitor, 'hips', materials.trousers, [0.36, 0.17, 0.26], [0, 0.58, 0])
  addMesh(
    visitor,
    'shirt',
    new THREE.CapsuleGeometry(0.21, 0.32, 6, 12),
    materials.shirt,
    0,
    0.95,
    0,
  )
  addMesh(
    visitor,
    'neck',
    new THREE.CylinderGeometry(0.085, 0.085, 0.16, 10),
    materials.skin,
    0,
    1.31,
    0,
  )
  addMesh(visitor, 'head', new THREE.SphereGeometry(0.23, 16, 12), materials.skin, 0, 1.52, 0)
  addMesh(
    visitor,
    'hair',
    new THREE.SphereGeometry(0.24, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.57),
    materials.hair,
    0,
    1.535,
    -0.012,
  )
  for (const [side, sign] of [
    ['left', -1],
    ['right', 1],
  ] as const) {
    addMesh(
      visitor,
      `${side}-eye`,
      new THREE.SphereGeometry(0.018, 8, 6),
      materials.hair,
      sign * 0.073,
      1.52,
      0.215,
    )
    const shoulder: [number, number, number] = [sign * 0.185, 1.18, 0]
    const elbow: [number, number, number] = [sign * 0.3, 0.94, 0.15]
    const hand: [number, number, number] = [sign * 0.15, 1.08, 0.42]
    addLimb(visitor, `${side}-sleeve`, materials.shirt, shoulder, elbow, 0.085)
    addLimb(visitor, `${side}-forearm`, materials.skin, elbow, hand, 0.057)
    addMesh(
      visitor,
      `${side}-hand`,
      new THREE.SphereGeometry(0.066, 10, 8),
      materials.skin,
      ...hand,
    )
  }

  const phone = new THREE.Group()
  phone.name = 'smartphone'
  phone.position.set(0, 1.1, 0.445)
  // 画面を+z側に向け、地図の縮小表示でもスマホを認識できる寸法にする。
  addBox(phone, 'phone-body', materials.phone, [0.25, 0.4, 0.055], [0, 0, 0])
  addBox(phone, 'phone-speaker', materials.frame, [0.06, 0.009, 0.008], [0, 0.179, 0.032])
  visitor.add(phone)
  return visitor
}

/** 表が+zを向く自立式ホワイトボード。脚を含む高さ2.0。 */
export function createBoothWhiteboard(materials: BoothModelMaterials): THREE.Group {
  const whiteboard = new THREE.Group()
  whiteboard.name = 'whiteboard'
  for (const [side, x] of [
    ['left', -0.72],
    ['right', 0.72],
  ] as const) {
    addBox(whiteboard, `${side}-foot`, materials.frame, [0.12, 0.065, 0.65], [x, 0.0325, 0])
    addBox(whiteboard, `${side}-post`, materials.frame, [0.055, 1.92, 0.055], [x, 1.025, 0])
  }
  addBox(whiteboard, 'board-frame', materials.frame, [1.85, 1.22, 0.095], [0, 1.39, 0])
  addBox(whiteboard, 'board-surface', materials.board, [1.74, 1.11, 0.025], [0, 1.39, 0.059])
  addBox(whiteboard, 'pen-tray', materials.frame, [1.72, 0.04, 0.16], [0, 0.785, 0.1])
  return whiteboard
}
