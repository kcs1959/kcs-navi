interface Illustration {
  src: string
  width: number
  height: number
}

interface TeamPresentation {
  tint: string
  card?: Illustration
  teamCard?: Illustration
  detail?: Illustration
  hero?: Illustration
  mapIcon?: Illustration
}

// 画像は作品そのものではなく班の分野を表す装飾。未対応の key に別分野の画像を
// 流用せず、D1 に新しい班を登録した場合も名前・紹介文だけで表示できるようにする。
const presentations: Record<string, TeamPresentation> = {
  vr: {
    tint: 'var(--lavender)',
    card: { src: '/figma/works-frame.svg', width: 302, height: 124 },
    teamCard: { src: '/figma/team-frame1.svg', width: 302, height: 124 },
    detail: { src: '/figma/detail-frame.svg', width: 302, height: 140 },
    hero: { src: '/figma/team-frame.svg', width: 302, height: 140 },
    mapIcon: { src: '/figma/map-icon-glasses.svg', width: 30, height: 30 },
  },
  game: {
    tint: 'var(--mint)',
    card: { src: '/figma/works-frame1.svg', width: 302, height: 124 },
    detail: { src: '/figma/works-frame1.svg', width: 302, height: 124 },
    mapIcon: { src: '/figma/map-icon-gamepad2.svg', width: 30, height: 30 },
  },
  dtm: {
    tint: 'var(--lemon)',
    card: { src: '/figma/works-frame2.svg', width: 302, height: 124 },
    detail: { src: '/figma/works-frame2.svg', width: 302, height: 124 },
    mapIcon: { src: '/figma/map-icon-music2.svg', width: 22, height: 22 },
  },
}

const neutralPresentation: TeamPresentation = { tint: 'var(--paper)' }

export function getTeamPresentation(key?: string): TeamPresentation {
  // DB の任意の key（toString など）も既存オブジェクトのプロパティとして扱わない。
  return key && Object.hasOwn(presentations, key) ? presentations[key]! : neutralPresentation
}
