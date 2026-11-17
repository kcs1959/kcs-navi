# 初回開発環境構築

## 1. Node.js と npm を入れる

```sh
git clone https://github.com/kcs1959/kcs-navi.git
cd kcs-navi

nvm install # Node.jsのインストール
nvm use # Node.jsのバージョンを.nvmrcで書かれているものに切り替える
npm install --global npm@11.13.0 # npmパッケージのインストール

# 入ったか確認
node --version
npm --version
```

今回、Node.js は `v22.23.4`、npm は `11.13.0` を使用する。
Wranglerの最低要件はNode.js 22.0.0だが、現在のNuxtは22.22.3以上が必要なため、22系の対応版に揃える。

既に開いているターミナルでNode.js 20が使われる場合は、`nvm use`で切り替える。
新しく開くターミナルでもこのバージョンを使う場合は、`nvm alias default 22.23.4`を実行する。

## 2. 依存関係と環境変数を用意する

`package-lock.json`をもとに、npmパッケージ（依存ライブラリ）をインストールする。

```sh
npm ci
```

また、Nuxt用の`.env`と、Wrangler用の`.dev.vars`を作成する。

```sh
cp .env.example .env
cp .dev.vars.example .dev.vars
```

両ファイルの `NUXT_PUBLIC_SITE_URL` を一致させる。データ参照先のモードは、ローカルD1とする。

## 3. ローカルD1（データベース）を準備する

DBのマイグレーションを行う。

```sh
npm run db:migrate:local
```

ローカルDBに、シードデータ（`seeds/test.sql`）を投入する。同じIDを再投入すると内容が更新される。

```sh
npx wrangler d1 execute DB --local --file seeds/test.sql
```

## 4. 開発サーバーを起動する

```sh
npm run dev
```

出力されたlocalhostのURLを開く。
（開発サーバーにおいても、 `wrangler.jsonc` の `DB` バインディングを使用している）

## 5. データベースをGUIで確認する（バックエンド開発者向け）

`d1studio`を使って、Cloudflare D1データベースの内容を管理できる。

```sh
npm install --global d1s@0.3.16
d1studio
```

# 通常開発時

## 1. 依存ライブラリを追加・変更したとき

随時、以下を実行する。

```sh
npm install
```

## 2. 挙動確認

開発サーバーを起動し、localhostのURLをブラウザで開く。

```sh
npm run dev
```

## 3. 実データを変更したとき

`seeds/` 内のSQLを編集し、編集したファイルを指定して手動で投入する。

```sh
npx wrangler d1 execute DB --local --file seeds/test.sql
```

混雑表示の確認用ダミー記録を投入する。混雑度は投入時刻を基準に直近20分で計算されるため、確認の直前に投入する。必ず `--local` で実行し、`--remote` では実行しない。まずリセットし、確認したい混雑度の seed を1つだけ投入する。

```sh
npx wrangler d1 execute DB --local --file seeds/checkins-reset.sql
# 以下から確認したい混雑度を1つだけ実行する
npx wrangler d1 execute DB --local --file seeds/checkins-relaxed.sql
npx wrangler d1 execute DB --local --file seeds/checkins-moderate.sql
npx wrangler d1 execute DB --local --file seeds/checkins-busy.sql
```

## 4. ユニットテストを行う

```sh
npm install -D vitest @nuxt/test-utils @vue/test-utils happy-dom @cloudflare/vitest-plugin
npm test
```

## 5. PWAの動作を確認する

Service Workerは本番ビルドにだけ生成される（`npm run dev`では動かない）。ビルドしてWranglerで配信し、ブラウザで確認する。

```sh
npm run build
npm run preview
```

1. `http://localhost:3000` を開き、DevToolsのApplicationタブで **Service Workers** に `sw.js` が activated で登録されていること、**Manifest** に名前とアイコンが出ていることを見る。
2. Applicationタブの **Cache Storage** に `pages`（`/`・`/menu`・`/crowd`・`/exhibitions`・`/teams`）、`api`、`fonts`、precache が並ぶのを待つ。
3. `wrangler dev` を止めるか、Networkタブで Offline にしてページを再読み込みする。開いたことのあるページはそのまま表示され、上部に「オフラインです」の帯が出る。開いたことのないURLは「オフラインです」の案内ページになる。
4. Service Workerの型検査は `npx tsc --noEmit -p service-worker/tsconfig.json` で行う（`npm run typecheck` の対象外）。

# Cloudflare Workersへの初回公開（作成済みのWorker・D1を使う場合）

## 1. 本番のIDとURLを確認する

`wrangler.jsonc`には本番D1と公開URLを設定済み。接続先を変える場合は、次の値を更新する。

| 設定                            | 入れる値                                                                    |
| ------------------------------- | --------------------------------------------------------------------------- |
| `d1_databases[0].database_id`   | 作成済みD1の「Database ID」。Workerと同じCloudflareアカウントのDBを指定する |
| `d1_databases[0].database_name` | 本番D1の名前。現在は`kcs-navi-db`                                           |
| `vars.NUXT_PUBLIC_SITE_URL`     | 公開先の完全なURL。現在は`https://kcs-navi.kcs1959.workers.dev`             |

Workerの名前は`kcs-navi`、D1のバインディング名は`DB`のままにする。
通常のWranglerログインとWorkers Buildsでは、`account_id`やAPIトークンをファイルに書く必要はない。
`NUXT_PUBLIC_SITE_URL`が閲覧中のURLと異なると、チェックイン・いいねの送信が403になる。
ローカルの`.env`と`.dev.vars`には、引き続き`http://localhost:3000`を指定する。

## 2. 空の本番D1にテーブルを作る

リポジトリのルートで実行する。`--remote`はCloudflare上の本番D1が対象。
デプロイだけではマイグレーションは実行されない。

```sh
nvm use
npx wrangler login
npm run db:migrate:remote
```

最後のコマンドは`npx wrangler d1 migrations apply DB --remote`と同じ。
ローカルD1に適用する場合は`npm run db:migrate:local`を使う。

マイグレーションはテーブルを作成するだけで、班・展示のデータは追加しない。
必要な初期データはSQLを確認してから、別途`npx wrangler d1 execute DB --remote --file <SQLファイルのパス>`で投入する。
`seeds/test.sql`はテスト用なので、本番データとして自動投入しない。

## 3. mainに反映して再デプロイする

上の設定変更をコミットして`main`へpushする。Cloudflare Workers Buildsの設定は以下でよい。

Workers BuildsはGitHub上の設定を使うため、ローカルでの書き換えや手動デプロイだけでは反映されない。
`D1 binding 'DB' references database '00000000-0000-4000-8000-000000000001'`（10181）が出た場合は、修正を含むコミットがGitHubの`main`にあることを確認する。
古いコミットのRetryではなく、修正後の新しいコミットのビルド結果を確認する。

| 項目              | 値                    |
| ----------------- | --------------------- |
| Production branch | `main`                |
| Root directory    | `/`                   |
| Build command     | `npm run build`       |
| Deploy command    | `npx wrangler deploy` |

Node.jsは`.nvmrc`と`.node-version`、npmは`package.json`の`packageManager`で指定するため、追加のBuild Variablesは不要。
既に`NODE_VERSION`をCloudflareで設定している場合は、`.nvmrc`と同じ値に合わせるか削除する。
本番URLは`wrangler.jsonc`の`vars`で管理するため、ダッシュボード側で同じ変数を重複設定する必要はない。

手動で確認・公開する場合は、次のコマンドを使う。

```sh
npm run build
npx wrangler deploy --dry-run # ローカルでデプロイ用のバンドルを確認する
npm run deploy # 実際にCloudflareへ公開する
```

公開後は、トップページと`/api/teams`・`/api/exhibitions`が開けること、チェックイン・いいねが送信できることを確認する。
データ未投入なら班・展示は空の一覧になる。
