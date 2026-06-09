# Wallet — 家計簿アプリ

Next.js 16 + Prisma 7 + PostgreSQL + NextAuth（Google OAuth）で構築した個人用家計簿アプリです。

## 機能

- Google アカウントでのログイン
- 収入・支出の記録とカテゴリ別集計
- 複数財布（現金・銀行・クレジット）の管理
- 月別・週別・3日単位の収支グラフ
- 予算管理・サブスク管理・定期収入管理

## 技術スタック

- **フロントエンド:** Next.js 16 (App Router), React 19, Tailwind CSS 4, Recharts
- **バックエンド:** Server Actions, Prisma 7, PostgreSQL
- **認証:** NextAuth v5 (Google OAuth)

## セットアップ

### 1. 依存関係のインストール

```bash
pnpm install
```

### 2. 環境変数

`.env.example` をコピーして `.env.local` を作成します。

```bash
cp .env.example .env.local
```

| 変数名 | 説明 |
|--------|------|
| `DATABASE_URL` | PostgreSQL 接続文字列 |
| `AUTH_SECRET` | NextAuth 用シークレット（`openssl rand -base64 32`） |
| `AUTH_GOOGLE_ID` | Google OAuth クライアント ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth クライアントシークレット |

### 3. データベース

```bash
pnpm exec prisma migrate deploy
pnpm db:seed
```

### 4. 開発サーバー

```bash
pnpm dev
```

[http://localhost:3000](http://localhost:3000) でアクセスできます。

## Docker

PostgreSQL とアプリをまとめて起動する場合:

```bash
cp .env.example .env.local
# .env.local に AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET を設定
docker compose up --build
```

## スクリプト

| コマンド | 説明 |
|---------|------|
| `pnpm dev` | 開発サーバー起動 |
| `pnpm build` | 本番ビルド |
| `pnpm start` | 本番サーバー起動 |
| `pnpm lint` | ESLint 実行 |
| `pnpm db:migrate` | マイグレーション適用 |
| `pnpm db:seed` | デフォルトカテゴリ投入 |

## プロジェクト構成

```
src/
├── app/           # ページ・Server Actions
├── components/    # UI コンポーネント
├── lib/           # DB・認可・ユーティリティ
├── auth.ts        # NextAuth 設定（Edge 対応）
└── auth.server.ts # サーバー専用認証ヘルパー
prisma/
├── schema.prisma
├── migrations/
└── seed.ts
```
