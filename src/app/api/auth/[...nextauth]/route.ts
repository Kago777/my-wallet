/**
 * [認証] NextAuth APIルート
 *
 * 役割：GoogleのOAuthコールバックを受け取るAPIエンドポイント
 * 実行環境：Node.js
 *
 * 処理フロー：
 * 1. ユーザーがGoogleログインボタンを押す
 * 2. Googleの認証画面にリダイレクト
 * 3. 認証成功後、Googleがこのエンドポイントにコールバック
 * 4. NextAuthがセッションを作成
 * 5. / にリダイレクト → middleware.tsがログイン済みと判定
 *
 * 依存：src/auth.ts
 */
import { handlers } from "@/auth";
export const { GET, POST } = handlers;