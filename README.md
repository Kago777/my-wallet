# my-wallet

個人向けパーソナル家計簿Webアプリ。収支管理・サブスク管理・予算管理などの機能を備えたフルスタックWebアプリケーション。

🌐 **デモ：** https://wallet.kagotani.me

---

## 技術スタック

| カテゴリ | 技術 |
|----------|------|
| フレームワーク | Next.js 16.2.7（App Router） |
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
  ├── Next.js App（ポート8080）
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

# Prismaクライアントの生成
pnpm exec prisma generate

# DBのセットアップ
pnpm exec prisma db push

# 開発サーバーの起動
pnpm dev
```

### Dockerでの起動

`.env.example` をコピーして `.env.local` を作成し、`AUTH_SECRET`・`AUTH_GOOGLE_ID`・`AUTH_GOOGLE_SECRET` を設定してください。`DATABASE_URL` は `docker-compose.yml` で PostgreSQL サービス向けに上書きされます。

```bash
cp .env.example .env.local
docker compose up -d --build
```

アプリは [http://localhost:3000](http://localhost:3000) で起動します。

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
| `AUTH_SECRET` | NextAuth.js署名シークレット | ✅ |
| `AUTH_GOOGLE_ID` | Google OAuth クライアントID | ✅ |
| `AUTH_GOOGLE_SECRET` | Google OAuth クライアントシークレット | ✅ |
| `NEXTAUTH_URL` | アプリのベースURL | ✅ |
| `NODE_ENV` | 実行環境（production） | ✅ |

### .env.local の例

```env
DATABASE_URL=postgresql://user:password@localhost:5432/mywallet
AUTH_SECRET=your_secret_here
AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_client_secret
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
```

### Google OAuth設定

[Google Cloud Console](https://console.cloud.google.com/) にて以下のリダイレクトURIを登録：

```
http://localhost:3000/api/auth/callback/google   # ローカル開発用
https://wallet.kagotani.me/api/auth/callback/google  # 本番用
```