import type { DeskKey } from './types'

// フロント固定のdesk_id。APIのdeskKey・D1のexhibitions.desk_keyへ同じ値を登録する。
export const boothMapLocations = [
  { deskId: 'desk-a', objectId: 'wall-desk-1', label: '展示机 A', side: 'top' },
  { deskId: 'desk-b', objectId: 'wall-desk-2', label: '展示机 B', side: 'top' },
  { deskId: 'desk-c', objectId: 'wall-desk-3', label: '展示机 C', side: 'top' },
  { deskId: 'desk-d', objectId: 'wall-desk-4', label: '展示机 D', side: 'top' },
  { deskId: 'desk-e', objectId: 'wall-desk-5', label: '展示机 E', side: 'top' },
  { deskId: 'desk-f', objectId: 'panel-side-desk', label: '壁ホワイトボードの左隣の机', side: 'bottom' },
  { deskId: 'board-wall', objectId: 'wall-whiteboard', label: '壁ホワイトボード', side: 'top' },
  { deskId: 'board-stand', objectId: 'whiteboard', label: '自立式ボード', side: 'bottom' },
  { deskId: 'smartphone', objectId: 'smartphone', label: 'スマートフォン', side: 'bottom' },
] as const satisfies readonly {
  deskId: DeskKey
  objectId: string
  label: string
  side: 'top' | 'bottom'
}[]
