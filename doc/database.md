# KCS Navi データベース設計

[requirements.md](requirements.md) の**第3節「開発スコープ」を優先**する。Cloudflare D1（SQLite）を使用し、4テーブルで構成する。旧案のPostgreSQL、`desks`、制作者名の独立項目、利用者ID・識別Cookieは採用しない。

スキーマの実装上の定義は [0001_create_exhibitions.sql](../migrations/0001_create_exhibitions.sql)。本書およびSQLファイルの作成のみを行い、マイグレーション・シードの実行は開発者が行う。

## テーブル・関連

| テーブル      | 主なカラム                                                                                                             | 役割・関連                                |
| ------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `teams`       | `id INTEGER PRIMARY KEY`, `key TEXT`, `name TEXT`, `description TEXT`                                                  | 班紹介。`key` は一意の表示用キー          |
| `exhibitions` | `id INTEGER PRIMARY KEY`, `team_id INTEGER`, `desk_key TEXT`, `title TEXT`, `description TEXT`, `creator_comment TEXT` | 作品詳細。各作品は1班に所属               |
| `checkins`    | `id INTEGER PRIMARY KEY`, `checked_in_at TEXT`                                                                         | ブース全体のチェックイン。1 POSTにつき1行 |
| `likes`       | `id INTEGER PRIMARY KEY`, `exhibition_id INTEGER`, `created_at TEXT`                                                   | 作品へのいいね。1 POSTにつき1行           |

`teams.id → exhibitions.team_id` は1対多、`exhibitions.id → likes.exhibition_id` は1対多。チェックインは作品・班に紐づけない。`INTEGER PRIMARY KEY` はSQLiteの自動採番を使用する。

机の座標・表示名はアプリケーションの固定設定で管理し、`desk_key` は `desk-a`、`desk-b`、`desk-c` のいずれか。1つの机に複数作品を表示できるよう、`desk_key` に一意制約は設けない。制作者名を載せるときは、登録者が `creator_comment` の本文に含める。

## 制約・インデックス

主キー以外の全カラムを `NOT NULL` とする。

| 対象                          | 制約                                                                       |
| ----------------------------- | -------------------------------------------------------------------------- |
| `teams.key`                   | `UNIQUE`、1〜40文字                                                        |
| `teams.name`                  | 1〜100文字                                                                 |
| `teams.description`           | 1〜5,000文字                                                               |
| `exhibitions.team_id`         | 外部キー、班削除は `ON DELETE RESTRICT`                                    |
| `exhibitions.desk_key`        | 固定3キーの `CHECK`                                                        |
| `exhibitions.title`           | 1〜200文字                                                                 |
| `exhibitions.description`     | 1〜10,000文字                                                              |
| `exhibitions.creator_comment` | 0〜5,000文字                                                               |
| `likes.exhibition_id`         | 外部キー、作品削除は `ON DELETE CASCADE`                                   |
| 日時カラム                    | UTC ISO 8601・ミリ秒3桁の正規形（例 `2026-11-01T01:00:00.000Z`）を `CHECK` |

インデックスは `exhibitions(team_id)`、`exhibitions(desk_key)`、`checkins(checked_in_at)`、`likes(exhibition_id)`。利用者単位の一意制約や識別情報を保存するインデックスは設けない。

日時の既定値はD1の `strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`。UTC正規形に統一することで、時刻の文字列範囲比較をインデックスで扱える。APIはクライアントから日時や利用者情報を受け付けない。

## チェックイン・集計

受け付けたPOSTごとに `INSERT INTO checkins DEFAULT VALUES` を実行し、保存時刻を `RETURNING checked_in_at` で取得する。同一利用者の判定、重複排除、再入場判定は行わない。受付完了の303リダイレクトで時刻を表示用に渡すが、識別子や入場証明には使用しない。

集計は取得時に再計算し、累計・推定人数・混雑率の専用テーブルは作らない。D1の時計から基準時刻を1回取得し、すべての集計へ同じ値をバインドする。集計クエリはD1のバッチ内で実行する。

以下の `:now` はUTCの基準時刻、`:window_start` はその20分前を表す。

```sql
SELECT strftime('%Y-%m-%dT%H:%M:%fZ', 'now') AS now;

-- 両端を含む直近20分。未来のデータは除く。
SELECT COUNT(CASE WHEN checked_in_at >= :window_start THEN 1 END) AS estimated_visitors,
       MAX(checked_in_at) AS last_checkin_at
FROM checkins
WHERE checked_in_at <= :now;

-- JSTの日別。該当する日がなければAPIの当日件数は0。
SELECT strftime('%Y-%m-%d', checked_in_at, '+9 hours') AS date,
       COUNT(*) AS count
FROM checkins
WHERE checked_in_at <= :now
GROUP BY date
ORDER BY date;

-- 日付込みの1時間単位。異なる日付の同じ時刻を合算しない。
SELECT strftime('%Y-%m-%dT%H:00:00+09:00', checked_in_at, '+9 hours') AS hour,
       COUNT(*) AS count
FROM checkins
WHERE checked_in_at <= :now
GROUP BY hour
ORDER BY hour;
```

- 当日はJST（Asia/Tokyo）の00:00以上・翌日00:00未満。JSTには夏時間がないため固定の `+9 hours` を使用する。
- 直近20分は20分前以上・基準時刻以下で、両端を含む。未来の記録は全集計から除外する。
- 開催時間が未確定のため、開催時間外も受け付けた記録は集計に含める。
- 推定滞在人数は直近20分の件数。推定混雑率は `推定滞在人数 / 40 × 100` で、100%を超えても切り詰めない。
- 混雑ラベルは50%未満「ゆったり」、50%以上80%未満「やや混雑」、80%以上「混雑」。判断理由・境界条件は `server/services/checkins.ts` とD1リポジトリのコメントに残す。
- APIは計算時刻と最後の記録時刻（記録なしなら `null`）を返す。画面は「推定」と明記し、30秒ごとに再取得する。

## いいね

存在する作品に対してのみ1行追加し、その後の合計件数を返す。D1のバッチで追加と集計を行い、同時更新による読み出し・上書き競合を避ける。作品なしならAPIは404を返す。

```sql
INSERT INTO likes (exhibition_id)
SELECT id FROM exhibitions WHERE id = :exhibition_id;

SELECT COUNT(*) AS count FROM likes WHERE exhibition_id = :exhibition_id;
```

すべてバインドパラメータを使用する。いいね0件の作品には0を返す。利用者識別・利用者ごとの回数制限・複数種類のリアクションは設けない。

## 開発用データ

[test.sql](../seeds/test.sql) は架空の7班・4作品（机Aに2作品、机B・Cに1作品ずつ）を登録するローカル検証用SQL。`INSERT OR IGNORE` により既存IDの編集済み行は上書きしない。架空の来場・いいねはD1へ投入せず、両方0件から始める。

`NUXT_DATA_MODE=demo` はD1を使わず、プロセス内の架空データで動作する。デモの記録は再起動で消え、APIの `mode` と画面でデモと明記する。実際の記録を保存する運用は `d1` モードを使い、接続失敗時にデモへ切り替えない。
