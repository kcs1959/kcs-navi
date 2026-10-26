# KCS Navi API設計

TODO: 以下をまとめる。

- そのAPIの持つ機能
- HTTPリクエストメソッド
- URL
- レスポンスのJSON形式
- Controller・Service・Repositoryの疑似コード（発展）

# 例（リアクションの登録API）
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
