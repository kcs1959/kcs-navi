# KCS Navi API設計

TODO: 以下をまとめる。

- APIの持つ機能
- HTTPリクエストメソッド
- URL
- レスポンスのJSON形式
- Controller・Service・Repositoryの疑似コード（発展）

# リアクションの登録API

1. APIの持つ機能

- 展示作品に対して、来場者が「いいね」を登録できる。
- 指定された展示作品に「いいね」を追加する
- 展示作品が存在するか確認する
- 同一来場者による重複登録を防止する（発展）
- 登録後のリアクション総数を取得して返す
- ログインなしで利用できる

2. HTTPリクエストメソッド

- POST

3. URL

- `POST /api/v1/exhibits/{exhibit_id}/reactions`

4. レスポンス形式

```
   {
   "exhibit_id": 123,
   "reaction_count": 21
   }
```

# 展示作品取得API

1. APIのもつ機能

- 来場者が地図上で選択した机の展示作品を取得できる(F-03)
- 作品名、説明、制作者名、所属班名、制作者コメントを返す(F-04)
- 作品ごとのリアクション数を返す(F-25)
- ログインなしで利用できる

2. HTTPリクエストメソッド
   データを読むだけなのでGETのみ。

- GET　

# 来場者数集計API

1. APIの持つ機能 -当日のチェックイン数（延べ人数）を集計する -日別のチェックイン数を集計する（F-15）。-時間別のチェックイン数を集計する（F-16）。-日本時間（Asia/Tokyo）を基準に集計する。-集計結果をJSON形式で返す。-チェックイン記録が存在しない場合、当日のチェックイン数は0件として返す。-ログインなしで利用できる。

2. HTTPリクエストメソッド

- GET

3. URL

- `GET /api/v1/checkins/stats`

4. レスポンス形式

```
   {
  "today": {
    "date": "2026-10-26",
    "count": 120
  },
  "daily": [
    {
      "date": "2026-10-25",
      "count": 80
    },
    {
      "date": "2026-10-26",
      "count": 120
    }
  ],
  "hourly": [
    {
      "hour": "2026-10-26T10:00:00+09:00",
      "count": 35
    },
    {
      "hour": "2026-10-26T11:00:00+09:00",
      "count": 42
    }
  ]
}
```

# QRコードチェックイン API

## 1.機能

- 来場者が会場入口のQRコードをスマートフォンで読み取ることで、イベントへのチェックイン処理を行う機能。
- QRコード（トークン）の有効性検証、二重チェックインの防止、チェックイン日時の記録を行う。

## 2.HTTPリクエストメソッド

- POST

## 3.URL

- /api/v1/events/{eventId}/check-in

## 4.レスポンスのJSON形式

### Case1.成功時 (200 OK)

{
"status": "success",
"data": {
"checkInId": "chk_88291039",
"eventId": "evt_12345678",
"userId": "usr_98765432",
"status": "CHECKED_IN",
"checkedInAt": "2026-10-26T19:50:00Z"
}
}

### Case2.エラー時 (400 Bad Request)

{
"status": "fail",
"message": "すでにチェックインが完了しています。"
}

## 5.疑似コード

### Controller:

class CheckInController {
constructor(checkInService) {
this.checkInService = checkInService;
}

async handleCheckIn(req, res) {
try {
const eventId = req.params.eventId;

const userId = req.user.id;
const { qrToken } = req.body;

if (!qrToken) {
return res.status(400).json({
status: "fail",
message: "QRトークンが必要です。"
});
}

const result = await this.checkInService.processCheckIn(eventId, userId, qrToken);
return res.status(200).json({
status: "success",
data: result
});
} catch (error) {
if (error.isBusinessError) {
return res.status(400).json({
status: "fail",
message: error.message
});
}
return res.status(500).json({
status: "error",
message: "内部サーバーエラーが発生しました。"
});
}
}
}

### Service:

class CheckInService {
constructor(checkInRepository, eventRepository) {
this.checkInRepository = checkInRepository;
this.eventRepository = eventRepository;
}

async processCheckIn(eventId, userId, qrToken) {
const event = await this.eventRepository.findByQrToken(qrToken);
if (!event || event.id !== eventId) {
throw new BusinessError("無効なQRコードです。");
}

const existingCheckIn = await this.checkInRepository.findByUserAndEvent(userId, eventId);
if (existingCheckIn) {
throw new BusinessError("すでにチェックインが完了しています。");
}

const checkInRecord = {
checkInId: "chk\_" + generateUniqueId(),
eventId: eventId,
userId: userId,
status: "CHECKED_IN",
checkedInAt: new Date().toISOString()
};

return await this.checkInRepository.save(checkInRecord);
}
}

### Repository:

class CheckInRepository {
constructor(dbClient) {
this.dbClient = dbClient;
}

async findByUserAndEvent(userId, eventId) {
const query = "SELECT \* FROM check_ins WHERE user_id = ? AND event_id = ?";
const result = await this.dbClient.queryOne(query, [userId, eventId]);
return result || null;
}

async save(record) {
const query = "INSERT INTO check_ins (id, event_id, user_id, status, checked_in_at) VALUES (?, ?, ?, ?, ?)";
await this.dbClient.execute(query, [
record.checkInId,
record.eventId,
record.userId,
record.status,
record.checkedInAt
]);
return record;
}
}

# 班情報取得API

1. APIの持つ機能

- 指定された班の情報を取得する
- 名前、画像（もしあれば）、その班の説明を返す

2. HTTPリクエストメソッド

- GET

3. URL

- /api/teams/{groupId}

4. レスポンス形式

[
{
"id": 1,
"name": "Web班",
"description": "ウェブサイトを開発しています。",
"members": [
{
"id": 101,
"role": "班長",
"name": "骨なしチキン"
}
],
"imageUrl": "/images/teams/web.png"
},
{
"id": 2,
"name": "音楽班",
"description": "音楽を作成しています。",
"members": [],
"imageUrl": null
}
]
