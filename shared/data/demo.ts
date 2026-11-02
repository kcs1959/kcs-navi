import type { Exhibition, Team } from '../types'

// Figma's sample titles are prototype content, not a confirmed festival program.
export const demoTeams: Team[] = [
  {
    id: 1,
    key: 'vr',
    name: 'VR・体験班',
    description:
      '現実を少し飛び出す、新しい体験をつくっています。VRやインタラクティブアートを通して、見て、触れて、驚く世界をお届けします。',
  },
  {
    id: 2,
    key: 'game',
    name: 'ゲーム班',
    description:
      '遊びのアイデアを、実際に遊べるゲームに。プログラム、グラフィック、音楽を組み合わせて、何度も試したくなる体験をつくります。',
  },
  {
    id: 3,
    key: 'dtm',
    name: 'DTM班',
    description:
      'パソコンを使った作曲・編曲に取り組んでいます。電子音楽からゲーム音楽まで、さまざまなジャンルのオリジナル楽曲を制作しています。',
  },
  {
    id: 4,
    key: 'web',
    name: 'Web班',
    description:
      '「こんなサイトがあったらいいな」を形に。デザインからサーバーまで、Webの技術を使って日常を少し楽しくするサービスをつくっています。',
  },
  {
    id: 5,
    key: 'ai',
    name: 'AI班',
    description:
      '機械学習や生成AIのしくみを学び、実際に動かして探究する班です。画像・音声・言葉を扱う、ちょっと不思議な体験を探ります。',
  },
  {
    id: 6,
    key: 'cg',
    name: 'CG班',
    description:
      '3DCGやイラスト、映像を制作しています。モデリングから質感、光の表現まで、一人ひとりの「好き」を作品に込めています。',
  },
  {
    id: 7,
    key: 'programming',
    name: 'プログラミング班',
    description:
      'アルゴリズムやアプリ開発を通して、プログラミングの面白さを探ります。小さな工夫から生まれる、便利で楽しいプログラムを紹介します。',
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
  {
    id: 3,
    teamId: 2,
    deskKey: 'desk-b',
    title: 'まよいの森の冒険',
    description:
      'ふしぎな森を探索する、オリジナルアクションゲーム。ジャンプと小さな仕掛けを使って、森の奥に隠されたひみつを見つけましょう。',
    creatorComment:
      '初めての方でもすぐ遊べる操作と、もう一度挑戦したくなるステージにこだわりました！',
    likes: 36,
  },
  {
    id: 4,
    teamId: 3,
    deskKey: 'desk-c',
    title: 'KCS Sound Collection',
    description:
      'DTM班が制作したオリジナル楽曲の試聴コーナー。ポップス、電子音楽、ゲーム音楽など、多彩な音の世界に触れられます。',
    creatorComment:
      'お気に入りの一曲を見つけていただけたらうれしいです。ヘッドホンでじっくり聴いてみてください！',
    likes: 21,
  },
]
