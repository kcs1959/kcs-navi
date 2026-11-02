// The map is fixed in code; these keys connect its buttons to D1 exhibition rows.
export const deskKeys = ['desk-a', 'desk-b', 'desk-c'] as const
export type DeskKey = (typeof deskKeys)[number]

export interface Team {
  id: number
  key: string
  name: string
  description: string
}

export interface Exhibition {
  id: number
  teamId: number
  deskKey: string
  title: string
  description: string
  creatorComment: string
  likes: number
}

export interface ExhibitionsResponse {
  exhibitions: Exhibition[]
}

export interface TeamsResponse {
  teams: Team[]
}

export interface LikeResponse {
  exhibitionId: number
  likes: number
}

export interface DailyCount {
  date: string
  count: number
}

export interface HourlyCount {
  hour: string
  count: number
}

export type CongestionLevel = 'relaxed' | 'moderate' | 'busy'

export interface Congestion {
  estimatedVisitors: number
  estimatedRate: number
  capacity: 40
  windowMinutes: 20
  level: CongestionLevel
  label: 'ゆったり' | 'やや混雑' | '混雑'
  calculatedAt: string
  lastCheckinAt: string | null
}

export interface CheckinStatsResponse {
  today: DailyCount
  daily: DailyCount[]
  hourly: HourlyCount[]
  congestion: Congestion
}

export interface CheckinSnapshot {
  calculatedAt: string
  lastCheckinAt: string | null
  estimatedVisitors: number
  daily: DailyCount[]
  hourly: HourlyCount[]
}
