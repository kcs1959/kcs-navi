-- KCS公式サイトの班紹介をもとにした班データ。
-- 本番データベースへの投入は行わない。
INSERT INTO teams (id, key, name, description) VALUES
  (1, 'ai', 'AI班', 'TensorFlowやPyTorchを用いた深層学習の開発や、機械学習の理論を学んでいます。部内AIコンペ、共同開発、上級生による新入生教育などを行っています。'),
  (2, 'web', 'Web班', 'HTML、CSS、JavaScriptやReactなどを用いて、WebサイトやWebアプリを制作しています。'),
  (3, 'game', 'Game班', 'UnityやUE5などを用いたゲーム制作を行い、矢上祭や三田祭での展示を目指しています。もくもく会や成果報告会も開催しています。'),
  (4, 'cg', 'CG班', '主にBlenderを用いて3DCGのモデリングをしています。VRChatへの実装や動画制作など、幅広く活動しています。'),
  (5, 'music', 'Music班', 'Studio One、Cubase、Ableton Live、Logic Pro、FL StudioなどのDAWを用いて音楽を制作しています。講習会やM3に向けたCD制作のほか、他班の作品への楽曲提供も行っています。'),
  (6, 'system', 'System班', 'OS、ネットワーク、セキュリティなど、低レイヤーの技術を学び、開発しています。OS開発やCTFに挑戦したい人におすすめの班です。'),
  (7, 'competitive-programming', '競プロ班', 'AtCoderなどの競技プログラミングサイトに参加しています。学祭では問題投稿サイトを利用した自作問題の展示も行っています。'),
  (8, 'youtube', '映像制作班', 'YouTubeを中心に、班員が作りたい動画を自由に制作・投稿しています。')
ON CONFLICT(id) DO UPDATE SET
  key = excluded.key,
  name = excluded.name,
  description = excluded.description;
