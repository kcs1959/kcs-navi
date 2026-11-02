import type { Exhibition, Team } from '../types'

// Figma's sample titles are prototype content, not a confirmed festival program.
export const demoTeams: Team[] = [
  {
    id: 1,
    key: 'game',
    name: 'ゲーム班',
    description:
      '遊びのアイデアを、実際に遊べるゲームに。プログラム、グラフィック、音楽を組み合わせて、何度も試したくなる体験をつくります。',
  },
]

export const demoExhibitions: Exhibition[] = [
  {
    id: 1,
    teamId: 1,
    deskKey: 'desk-a',
    title: '空を歩くVR',
    description:
      'VRゴーグルをつけて、空に浮かぶ小さな街へ。雲の上を歩いたり、地上を見渡したり、普段はできない空の旅を体験できます。',
    creatorComment:
      '空を自由に歩けたら、という憧れを形にしました。景色の広がりと、雲に包まれる感覚を楽しんでください！',
    likes: 24,
  },
  {
    id: 2,
    teamId: 1,
    deskKey: 'desk-a',
    title: 'ひかりのアトリエ',
    description:
      '手を動かすと、目の前に色とりどりの光が生まれるインタラクティブアート。体の動きで、自分だけの光の作品を描いてみましょう。',
    creatorComment:
      '見るだけでなく、みなさん自身が作品の一部になる体験をつくりました。自由に手を動かして遊んでみてください。',
    likes: 18,
  },
]
