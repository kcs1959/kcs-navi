-- 班・作品データの登録元。開催内容が確定したら、このファイルの内容を編集して手動で投入する。
-- 同じidの編集内容も反映する。INSERT OR REPLACEは関連するいいねを削除し得るため使わない。
-- 来場記録・いいねは登録・初期化しない。行を削除する場合は明示的なDELETE文を追加する。
INSERT INTO teams (id, key, name, description) VALUES
  (1, 'vr', 'VR・体験班', 'VRゴーグルで遊べる作品や、体の動きに反応するインタラクティブアートを制作しています。'),
  (2, 'game', 'ゲーム班', 'プログラム、グラフィック、音楽を組み合わせてゲームを制作しています。'),
  (3, 'dtm', 'DTM班', 'パソコンで作曲・編曲をしています。今回の展示では、班員が作った曲をヘッドホンで聴けます。'),
  (4, 'web', 'Web班', '画面のデザインからサーバー側の実装まで、Webサイトやサービスを制作しています。'),
  (5, 'ai', 'AI班', '機械学習や生成AIを学び、画像、音声、文章を扱うプログラムを試作しています。'),
  (6, 'cg', 'CG班', '3DCGやイラスト、映像を制作しています。3DCGでは、モデルを作り、素材の質感や光の当たり方を調整します。'),
  (7, 'programming', 'プログラミング班', 'アルゴリズムを学んだり、アプリを作ったりしています。')
ON CONFLICT(id) DO UPDATE SET
  key = excluded.key,
  name = excluded.name,
  description = excluded.description;

INSERT INTO exhibitions (id, team_id, desk_key, title, description, creator_comment) VALUES
  (1, 1, 'desk-a', '空を歩くVR', 'VRゴーグルをつけて、空に浮かぶ小さな街へ。雲の上を歩いたり、地上を見渡したり、普段はできない空の旅を体験できます。', '空を自由に歩けたら、という憧れを形にしました。景色の広がりと、雲に包まれる感覚を楽しんでください！'),
  (2, 1, 'desk-a', 'ひかりのアトリエ', '手を動かすと、目の前に色とりどりの光が生まれるインタラクティブアート。体の動きで、自分だけの光の作品を描いてみましょう。', '見るだけでなく、みなさん自身が作品の一部になる体験をつくりました。自由に手を動かして遊んでみてください。'),
  (3, 2, 'desk-b', 'まよいの森の冒険', 'ふしぎな森を探索する、オリジナルアクションゲーム。ジャンプと小さな仕掛けを使って、森の奥に隠されたひみつを見つけましょう。', '初めての方でもすぐ遊べる操作と、もう一度挑戦したくなるステージにこだわりました！'),
  (4, 3, 'desk-c', 'KCS Sound Collection', 'DTM班が制作したオリジナル楽曲の試聴コーナー。ポップス、電子音楽、ゲーム音楽など、多彩な音の世界に触れられます。', 'お気に入りの一曲を見つけていただけたらうれしいです。ヘッドホンでじっくり聴いてみてください！')
ON CONFLICT(id) DO UPDATE SET
  team_id = excluded.team_id,
  desk_key = excluded.desk_key,
  title = excluded.title,
  description = excluded.description,
  creator_comment = excluded.creator_comment;
