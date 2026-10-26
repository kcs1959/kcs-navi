# KCS Navi API設計

TODO: 以下をまとめる。

- APIの持つ機能
- HTTPリクエストメソッド
- URL
- レスポンスのJSON形式
- Controller・Service・Repositoryの疑似コード（発展）

# 例（リアクションの登録API）

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

- 机を選択すると作品を確認できる。
- 作品名、説明、制作者、所属班、制作者コメントを見られる

2. HTTPリクエストメソッド


3. URL

4. レスポンス形式
