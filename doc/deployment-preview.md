# Cloudflare Workers Preview

`main` 以外のブランチへの push と、同じリポジトリ内で作成された PR の作成・更新時に GitHub Actions が `wrangler preview` を実行する。本番の `wrangler deploy` は実行しない。

- PR ごとに `pr-<番号>` の Preview を作り、URL を PR コメントと Actions Summary に表示する。更新時は同じコメントを更新する。
- ブランチは `branch-<短縮名>-<ハッシュ>` の Preview を作り、URL を Actions Summary に表示する。ブランチ名を DNS 対応の形式へ変換し、ハッシュで衝突を避ける。
- 同じ PR / ブランチへの新しいコミットは同じ Preview を更新する。
- PR の close / merge 時には PR Preview を、ブランチ削除時にはブランチ Preview を削除する。
- Fork 由来の PR は Cloudflare 認証情報を渡さないため対象外とする。

## 初期設定

1. Cloudflare で Worker `kcs-navi` の Previews と `workers.dev` を利用できることを確認する。
2. **本番とは別の D1** `kcs-navi-preview` を作成し、`migrations/` を適用する。必要に応じて `seeds/test.sql` を手動で投入する。本番 D1 の ID は設定しない。
3. GitHub Actions secrets に `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`、`CLOUDFLARE_PREVIEW_D1_DATABASE_ID` を登録する。Workers の Preview 操作に必要な権限を付与する。
4. GitHub Actions repository variable `CLOUDFLARE_WORKERS_SUBDOMAIN` にアカウントの `workers.dev` サブドメイン名のみを設定する。例: `example.workers.dev` なら `example`。

D1 は **すべての Preview で共有するプレビュー専用データベース**とする。PR 単位での分離はないため、プレビュー上のチェックインやいいねの書き込みは他のプレビューにも影響する。

`wrangler.preview.jsonc` は CI 内で生成する設定であり、コミットしない。ここに Preview 専用 D1 バインディングと正しい `NUXT_PUBLIC_SITE_URL` を設定する。本番 Workers のデプロイには影響しない。

## 動作確認

1. `main` 以外のブランチに push して Actions Summary に Preview URL が出ることを確認する。
2. ブランチから PR を作成して PR コメントに `pr-<番号>` の URL が表示されることを確認する。
3. 追加コミット後、URL が同じまま新しいデプロイになることを確認する。
4. プレビューで D1 参照ページと書き込み操作を確認する。
5. PR を閉じる / ブランチを削除する際に Preview が削除されることを確認する。

プレビュー URL は既定で公開される。アクセスを制限する場合は Cloudflare Access を設定する。

参考: https://developers.cloudflare.com/workers/previews/ / https://developers.cloudflare.com/workers/previews/examples/
