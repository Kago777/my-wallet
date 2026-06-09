# my-wallet

個人向けパーソナル家計簿Webアプリ。収支管理・サブスク管理・予算管理などの機能を備えたフルスタックWebアプリケーション。

🌐 **デモ：** https://wallet.kagotani.me

---

## 技術スタック

| カテゴリ | 技術 |
|----------|------|
| フレームワーク | Next.js 16.2.7（App Router） |
| UIライブラリ | React 19 |
| 言語 | TypeScript |
| 認証 | NextAuth.js v5 beta（Google OAuth） |
| ORM | Prisma 7 |
| DB | PostgreSQL（Railway） |
| DBアダプター | @prisma/adapter-pg |
| スタイリング | Tailwind CSS v4 |
| UIコンポーネント | Lucide React |
| グラフ | Recharts |
| パッケージマネージャー | pnpm |
| コンテナ | Docker |
| ホスティング | Railway |
| DNS / CDN | Cloudflare |

---

## アーキテクチャ

```
ユーザー
  ↓
Cloudflare（DNS・CDN・DDoS保護）
  ↓
Railway（Dockerコンテナ）
  ├── Next.js App（ポート3000 ※Railwayが PORT を注入する場合あり）
  │   ├── App Router（Server Components）
  │   ├── Server Actions
  │   └── NextAuth.js（Google OAuth）
  └── PostgreSQL（Railway managed DB）
       └── Prisma ORM（@prisma/adapter-pg）
```

**認証フロー：**
```
ユーザー → Google OAuth → NextAuth.js → セッション管理 → 各ページ
```

---

## ローカル開発手順

### 前提条件

- Node.js 22以上
- pnpm
- Docker Desktop

### セットアップ

```bash
# リポジトリのクローン
git clone https://github.com/Kago777/my-wallet.git
cd my-wallet

# 依存関係のインストール
pnpm install

# 環境変数の設定
cp .env.example .env.local
# .env.local を編集して各値を設定

# PostgreSQL の起動（Docker）
docker compose up -d db

# .env.local の DATABASE_URL を Docker の DB に合わせる
# DATABASE_URL=postgresql://wallet:wallet@localhost:5432/my_wallet

# Prismaクライアントの生成
pnpm exec prisma generate

# DBのセットアップ（マイグレーション適用 + シード）
pnpm db:migrate
pnpm db:seed

# 開発サーバーの起動
pnpm dev
```

[http://localhost:3000](http://localhost:3000) でアクセスできます。

### Dockerでの起動（DB + アプリ）

`.env.example` をコピーして `.env.local` を作成し、`AUTH_SECRET`・`AUTH_GOOGLE_ID`・`AUTH_GOOGLE_SECRET` を設定してください。`DATABASE_URL` は `docker-compose.yml` で PostgreSQL サービス向けに上書きされます。

```bash
cp .env.example .env.local
docker compose up -d --build
```

アプリは [http://localhost:3000](http://localhost:3000) で起動します。

---

## 利用可能なスクリプト

| コマンド | 説明 |
|---------|------|
| `pnpm dev` | 開発サーバー起動 |
| `pnpm build` | 本番ビルド（Prisma 生成 + Next.js ビルド） |
| `pnpm start` | 本番サーバー起動 |
| `pnpm lint` | ESLint 実行 |
| `pnpm db:migrate` | マイグレーション適用（`prisma migrate deploy`） |
| `pnpm db:seed` | デフォルトカテゴリの投入 |

---

## デプロイ構成

### 構成概要

```
GitHub（mainブランチ）
  ↓ push
Railway（自動デプロイ）
  ↓ Dockerビルド
  ↓ prisma migrate deploy
  ↓ pnpm start
```

### Dockerビルドの流れ

```dockerfile
# 1. 依存関係インストール
pnpm install --frozen-lockfile

# 2. Prismaクライアント生成
pnpm exec prisma generate

# 3. Next.jsビルド
pnpm build

# 4. 起動時
prisma migrate deploy → db:seed → next start
```

### Cloudflare DNS設定

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | wallet | zlgojnzd.up.railway.app | ✅ Proxied |

---

## 環境変数一覧

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `DATABASE_URL` | PostgreSQL接続URL | ✅ |
| `AUTH_SECRET` | NextAuth.js署名シークレット（`openssl rand -base64 32`） | ✅ |
| `AUTH_GOOGLE_ID` | Google OAuth クライアントID | ✅ |
| `AUTH_GOOGLE_SECRET` | Google OAuth クライアントシークレット | ✅ |

> `NEXTAUTH_URL` / `NODE_ENV` はコード内で参照していません。NextAuth v5 は `trustHost: true` によりホストを自動判定し、`NODE_ENV` は Next.js / Node が自動設定します。

### .env.local の例

`.env.example` と同じ内容です。

```env
DATABASE_URL=postgresql://wallet:wallet@localhost:5432/my_wallet
AUTH_SECRET=your_secret_here
AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_client_secret
```

### Google OAuth設定

[Google Cloud Console](https://console.cloud.google.com/) にて以下のリダイレクトURIを登録：

```
http://localhost:3000/api/auth/callback/google   # ローカル開発用
https://wallet.kagotani.me/api/auth/callback/google  # 本番用
```
