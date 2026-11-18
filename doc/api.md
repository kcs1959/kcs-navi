# KCS Navi API

`requirements.md` の開発スコープ（第3節）を優先したプロトタイプ仕様。旧案の `/api/v1`、QRトークン、利用者ID、重複排除、制作者名、`desks` テーブルは使用しない。

## データソース

すべての環境でCloudflareの `DB` バインディングからD1を利用する。班・作品は開発者がシード等で登録したD1の行だけを返し、来場数・いいねはD1の記録を集計する。アプリケーション内に代替データやモード切替は持たない。D1未接続・読み書き失敗時は503とする。DBが空の場合は班・作品は空配列、件数は0を返す。

全APIは認証不要。読み取り結果と書き込み結果には `Cache-Control: no-store` を付ける。

## GET /api/exhibitions

```json
{
  "exhibitions": [
    {
      "id": 1,
      "teamId": 1,
      "deskKey": "desk-a",
      "title": "空を歩くVR",
      "description": "作品の説明",
      "creatorComment": "制作者コメント",
      "likes": 0
    }
  ]
}
```

机は固定設定の `desk-a`、`desk-b`、`desk-c`。同じ `deskKey` を持つ作品を複数返せる。制作者を表示する場合は登録者がコメント本文に含める。

## GET /api/teams

```json
{
  "teams": [
    {
      "id": 1,
      "key": "vr",
      "name": "VR・体験班",
      "description": "班の紹介文"
    }
  ]
}
```

## POST /api/exhibitions/:id/likes

リクエスト本文なし。作品IDは正の安全な整数。1リクエストでいいねを1件追加し、更新後の合計を返す。匿名識別や利用者ごとの一意制約は設けない。

```json
{ "exhibitionId": 1, "likes": 1 }
```

成功200、ID不正400、作品なし404。

## GET /checkin → POST /api/checkins → GET /welcome

入口QRのURLは `NUXT_PUBLIC_SITE_URL` + `/checkin`。受付ページの読み込み時にJavaScriptが空のフォームを1回自動POSTする。利用者が操作する登録・確認ボタンは設けない。

`POST /api/checkins` は本文を受け取らず、保存成功後に **303、Location: /welcome?checkedInAt=<サーバー時刻>&visitorNumber=<日本時間での当日の受付人数>** を返す。時刻と人数は表示用途に限り、識別子や入場証明として扱わない。受け付けたPOSTは毎回1件増やす。利用者ID・識別Cookie・QRトークン・再入場判定・二重登録抑制は設けない。日時はクライアント値を受け付けず、D1の時刻を保存する。WelcomeのGETや再読込では追加登録しない。

JavaScript無効時や通信失敗時は受付ページで状態を伝える。HTMLフォームのエラーは `/checkin?error=busy|forbidden|unavailable` へ303で戻し、自動POSTを停止して再試行リンクを表示する。JSONクライアントには元のエラーステータスを返す。識別情報を持たせないため、Welcomeの直アクセスだけではチェックインの成否を証明しない。

## GET /api/checkins/stats

```json
{
  "today": { "date": "2026-11-01", "count": 18 },
  "daily": [{ "date": "2026-11-01", "count": 18 }],
  "hourly": [{ "hour": "2026-11-01T10:00:00+09:00", "count": 18 }],
  "congestion": {
    "estimatedVisitors": 10,
    "estimatedRate": 25,
    "capacity": 40,
    "windowMinutes": 20,
    "level": "relaxed",
    "label": "ゆったり",
    "calculatedAt": "2026-11-01T01:10:00.000Z",
    "lastCheckinAt": "2026-11-01T01:08:00.000Z"
  }
}
```

- JSTの日別・日付を含む1時間単位で全記録を集計する。当日はJSTの00:00以上・翌00:00未満。0件なら当日件数は0、日別・時間別は空配列。
- 直近20分は基準時刻の20分前**以上**・基準時刻**以下**。未来の記録はどの集計からも除く。
- 開催時刻が確定していないため、開催時間外も受け付けた記録は集計する。
- 推定混雑率 = 推定滞在人数 ÷ 40 × 100。100%を超えても切り詰めない。
- 50%未満 `relaxed`（ゆったり）、50%以上80%未満 `moderate`（やや混雑）、80%以上 `busy`（混雑）。
- 計算ごとにD1の基準時刻を取得する。記録がなければ `lastCheckinAt` は `null`。フロントエンドは30秒ごとに再取得する。
- 実測ではなく「推定滞在人数」「推定混雑率」と明記する。

## 書き込みの保護・エラー

POSTは設定済み `NUXT_PUBLIC_SITE_URL` と `Origin` の一致を要求する。Originがない場合は `Sec-Fetch-Site: same-origin` のみ許可する。別Origin・別サブドメインからの要求は403。本文付き要求は400。

IPやCookieを保存しない、プロセス単位のトークンバケットを使用する。上限はチェックイン120件/分、いいね360件/分。超過時は429と `Retry-After: 1`。各Workerプロセスの枠は独立しているため、公開時のCloudflare側レート制限と併用する想定。これは連続送信への緩和策であり、利用者の重複判定ではない。

DB障害は503。DBの例外詳細はサーバーログに記録し、レスポンスには一般向けメッセージを返す。フロントエンドは読み込み・失敗・再試行を表示する。

## 層の責務

- `server/api`: HTTP、入力検証、Origin、リダイレクト。
- `server/services`: JST集計・推定値・混雑しきい値、入力・連続送信ポリシー。
- `server/repositories`: D1の読み書き。SQLのパラメータはバインドする。
- `shared/types.ts`: フロントエンドとAPI間の型。

DBスキーマは `migrations/0001_create_exhibitions.sql` が実装上の定義。4テーブルは `teams`、`exhibitions`、`checkins`、`likes`。班・作品のデータは `seeds/test.sql` に記述し、実際のDB投入は開発者が手動で行う。
