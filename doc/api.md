# KCS Navi API設計

TODO: 以下をまとめる。

- そのAPIの持つ機能
- HTTPリクエストメソッド
- URL
- レスポンスのJSON形式
- Controller・Service・Repositoryの疑似コード（発展）

# 例（リアクションの登録API）

QRコードチェックイン API

1.機能
来場者が会場入口のQRコードをスマートフォンで読み取ることで、イベントへのチェックイン処理を行う機能。
QRコード（トークン）の有効性検証、二重チェックインの防止、チェックイン日時の記録を行う。

2.HTTPリクエストメソッド
POST

3.URL
/api/v1/events/{eventId}/check-in

4.レスポンスのJSON形式

Case1.成功時 (200 OK)

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

Case2.エラー時 (400 Bad Request)
{
"status": "fail",
"message": "すでにチェックインが完了しています。"
}

5.疑似コード

Controller:
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

Service:
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

Repository:
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
