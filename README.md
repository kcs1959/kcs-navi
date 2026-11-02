# ローカル環境の構築

## 1. Node.js と npm をそろえる

Git、Node.js のバージョン管理ツール（以下は nvm）をインストールしてから実行します。

```sh
git clone https://github.com/kcs1959/kcs-navi.git
cd kcs-navi
nvm install
nvm use
npm install --global npm@11.13.0
node --version
npm --version
```

Node.js は `v24.22.1`、npm は `11.13.0` を使用します。

## 2. 依存関係と環境変数を用意する

```sh
npm ci
cp .env.example .env
```

`.env` の初期値は次のとおりです。

```dotenv
NUXT_PUBLIC_SITE_URL="http://localhost:3001"
NUXT_DATA_MODE="demo"
```

`NUXT_PUBLIC_SITE_URL` はアクセスするサイトの URL に合わせます。
`demo` では DB を用意せずに起動できます。入力内容はサーバー終了時に失われます。
`npm ci`、`npm run dev` はマイグレーションやシード投入を実行しません。

## 3. 開発サーバーを起動する

```sh
npm run dev
```

[http://localhost:3001](http://localhost:3001) を開きます。

## 4. ローカル D1 を利用して起動する場合

DB の作成・変更・データ投入は、以下の手順を確認した開発者が手動で行います。
この手順は DB が必要な場合だけ実施します。

```sh
cp .dev.vars.example .dev.vars
npx wrangler d1 migrations apply kcs-navi --local
```

サンプルデータも必要な場合だけ、ローカル DB に投入します。

```sh
npx wrangler d1 execute kcs-navi --local --file seeds/test.sql
```

`.dev.vars` を次のように設定します。

```dotenv
NUXT_PUBLIC_SITE_URL="http://localhost:3001"
NUXT_DATA_MODE="d1"
```

Cloudflare Workers 用にビルドして、ローカル環境で起動します。

```sh
npm run build
npm run preview:workers
```

[http://localhost:3001](http://localhost:3001) を開きます。
Wrangler が使用するローカル DB は `.wrangler/` 内に保存されます。

## 5. 接続先の Cloudflare D1 を用意する場合

Cloudflare アカウントを用意し、開発者が次を実行します。

```sh
npx wrangler login
npx wrangler d1 create kcs-navi
```

出力された `database_id` を `wrangler.jsonc` の仮 ID と置き換えます。
接続先 DB のスキーマを作成する場合は、開発者が次を実行します。

```sh
npx wrangler d1 migrations apply kcs-navi --remote
```

リモート DB にサンプルを登録する必要がある場合のみ、接続先を確認してから実行します。

```sh
npx wrangler d1 execute kcs-navi --remote --file seeds/test.sql
```

Cloudflare 側の環境変数にも `NUXT_DATA_MODE="d1"` と公開先に対応する
`NUXT_PUBLIC_SITE_URL` を設定します。`.env` と `.dev.vars` はリポジトリに含めません。
