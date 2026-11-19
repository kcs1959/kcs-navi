import type { DeskKey } from './types'

// フロント固定のdesk_id。APIのdeskKey・D1のexhibitions.desk_keyへ同じ値を登録する。
export const boothMapLocations = [
  { deskId: 'desk-a', objectId: 'wall-desk-1', label: '展示机 A', side: 'top', inset: false },
  { deskId: 'desk-b', objectId: 'wall-desk-2', label: '展示机 B', side: 'top', inset: false },
  { deskId: 'desk-c', objectId: 'wall-desk-3', label: '展示机 C', side: 'top', inset: false },
  { deskId: 'desk-d', objectId: 'wall-desk-4', label: '展示机 D', side: 'top', inset: true },
  { deskId: 'desk-e', objectId: 'wall-desk-5', label: '展示机 E', side: 'top', inset: true },
  {
    deskId: 'desk-f',
    objectId: 'panel-side-desk',
    label: '壁ホワイトボードの左隣の机',
    side: 'bottom',
    inset: true,
  },
  {
    deskId: 'board-wall',
    objectId: 'wall-whiteboard',
    label: '壁ホワイトボード',
    side: 'top',
    inset: true,
  },
  {
    deskId: 'board-stand',
    objectId: 'whiteboard',
    label: '自立式ボード',
    side: 'bottom',
    inset: true,
  },
  {
    deskId: 'smartphone',
    objectId: 'smartphone',
    label: 'スマートフォン',
    side: 'bottom',
    inset: true,
  },
] as const satisfies readonly {
  deskId: DeskKey
  objectId: string
  label: string
  side: 'top' | 'bottom'
  inset: boolean
}[]

// 吹き出しカードのアンカーからの相対位置 (px)。空なら自動配置。
export const boothMapCalloutOffsets: Partial<Record<string, { x: number; y: number }>> = {
  'desk-a': {x: -20, y: -300},
  'desk-b': {x: 0, y: -220},
  'desk-c': {x: 0, y: -175},
  'desk-d': {x: 0, y: -120},
  'desk-e': {x: 0, y: -80},
  'desk-f': { x: 40, y: 40 },
  'board-wall': { x: -200, y: -150 },
  'board-stand': { x: -275, y: 100},
  'smartphone': { x: -200, y: 100},
}
