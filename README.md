# 初回開発環境構築

## 1. Node.js と npm を入れる

```sh
git clone https://github.com/kcs1959/kcs-navi.git
cd kcs-navi

nvm install # Node.jsのインストール
nvm use # Node.jsのバージョンを`.nvmrcで書かれているものに切り替える
npm install --global npm@11.13.0 # npmパッケージのインストール

# 入ったか確認
node --version
npm --version
```

今回、Node.js は `v24.22.1`、npm は `11.13.0` を使用する。

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
npx wrangler d1 migrations apply kcs-navi --local
```

ローカルDBに、シードデータ（`seeds/test.sql`）を投入する。同じIDを再投入すると内容が更新される。

```sh
npx wrangler d1 execute kcs-navi --local --file seeds/test.sql
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
npx wrangler d1 execute kcs-navi --local --file seeds/test.sql
```
