# 初回開発環境構築

## 1. Node.js と npm を入れる

Node.js のバージョン管理ツール（nvm）をインストールする。

```sh
git clone https://github.com/kcs1959/kcs-navi.git
cd kcs-navi
nvm install
nvm use
npm install --global npm@11.13.0
node --version
npm --version
```

今回、Node.js は `v24.22.1`、npm は `11.13.0` を使用する。

## 2. 依存関係と環境変数を用意する

`package-lock.json`をもとに、npmパッケージ（依存ライブラリ）をインストールする。

また、環境変数を設定した`.env`ファイルも作成する。

```sh
npm ci
cp .env.example .env
```

## 3. 開発サーバーを起動する

```sh
npm run dev
```

出力されたlocalhostのURLをブラウザで開く。

## 4. ローカル D1 を利用する

ローカルDBの接続情報を`.dev.vars`（`.env`のようなもの）に設定してから、DBのマイグレーションを行う。

```sh
cp .dev.vars.example .dev.vars
npx wrangler d1 migrations apply kcs-navi --local
```

シードデータを、ローカルDBに投入する。

```sh
npx wrangler d1 execute kcs-navi --local --file seeds/test.sql
```

Cloudflare Workers 用にビルドして、ローカルで起動する。

```sh
npm run build
npm run preview:workers
```

Wrangler が使用するローカル DB は `.wrangler/` 内に保存される。

# 通常開発時のコマンド

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

## 3. バックエンド（DB）開発者向け

Coming soon...
