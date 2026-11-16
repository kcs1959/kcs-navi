-- 学園祭の表示確認用サンプル。ローカル専用（--remote では実行しない）。
-- 班・展示は test.sql と同じ内容で更新し、いいねは変更しない。
-- チェックインは合計80件を追加する（直近12時間に50件、前日〜6日前に30件）。
-- 再投入すると来場記録が増える。合計80件で確認する場合は、先に既存の
-- seeds/checkins-reset.sql を --local で投入する（チェックイン全件が削除される）。
-- 投入方法は README の「3. 実データを変更したとき」と同じく、
-- npx wrangler d1 execute DB --local --file seeds/festival-sample.sql

INSERT INTO teams (id, key, name, description) VALUES
  (1, 'vr', 'VR・体験班', '現実を少し飛び出す、新しい体験をつくっています。VRやインタラクティブアートを通して、見て、触れて、驚く世界をお届けします。'),
  (2, 'game', 'ゲーム班', '遊びのアイデアを、実際に遊べるゲームに。プログラム、グラフィック、音楽を組み合わせて、何度も試したくなる体験をつくります。'),
  (3, 'dtm', 'DTM班', 'パソコンを使った作曲・編曲に取り組んでいます。電子音楽からゲーム音楽まで、さまざまなジャンルのオリジナル楽曲を制作しています。'),
  (4, 'web', 'Web班', '「こんなサイトがあったらいいな」を形に。デザインからサーバーまで、Webの技術を使って日常を少し楽しくするサービスをつくっています。'),
  (5, 'ai', 'AI班', '機械学習や生成AIのしくみを学び、実際に動かして探究する班です。画像・音声・言葉を扱う、ちょっと不思議な体験を探ります。'),
  (6, 'cg', 'CG班', '3DCGやイラスト、映像を制作しています。モデリングから質感、光の表現まで、一人ひとりの「好き」を作品に込めています。'),
  (7, 'programming', 'プログラミング班', 'アルゴリズムやアプリ開発を通して、プログラミングの面白さを探ります。小さな工夫から生まれる、便利で楽しいプログラムを紹介します。')
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

-- 時間帯ごとに山と谷をつけ、同じ時間帯でも到着時刻をずらす。
-- 現在の時間帯は経過済みの時間内に収め、未来の記録を作らない。
WITH RECURSIVE
  numbers(n) AS (
    SELECT 1
    UNION ALL
    SELECT n + 1 FROM numbers WHERE n < 9
  ),
  hourly(hours_ago, count) AS (
    VALUES (11, 1), (10, 2), (9, 3), (8, 4), (7, 7), (6, 9),
           (5, 8), (4, 6), (3, 4), (2, 3), (1, 2), (0, 1)
  ),
  daily(days_ago, count) AS (
    VALUES (6, 3), (5, 4), (4, 6), (3, 8), (2, 5), (1, 4)
  ),
  clock AS (
    SELECT strftime('%Y-%m-%dT%H:00:00Z', 'now') AS hour_start,
           CAST(strftime('%M', 'now') AS INTEGER) * 60
             + CAST(strftime('%S', 'now') AS INTEGER) AS elapsed_seconds
  )
INSERT INTO checkins (checked_in_at)
SELECT strftime('%Y-%m-%dT%H:%M:%fZ', clock.hour_start,
                '-' || hours_ago || ' hours',
                '+' || CASE WHEN hours_ago = 0 THEN clock.elapsed_seconds / 2
                            ELSE (n * 397 + hours_ago * 137) % 3600 END || ' seconds')
FROM hourly JOIN numbers ON n <= count CROSS JOIN clock
UNION ALL
SELECT strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+9 hours', 'start of day',
                '-' || days_ago || ' days', '-9 hours',
                '+' || (9 + (n * 3 + days_ago) % 8) || ' hours',
                '+' || ((n * 17 + days_ago * 7) % 60) || ' minutes')
FROM daily JOIN numbers ON n <= count;
