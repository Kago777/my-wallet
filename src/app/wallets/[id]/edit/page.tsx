import Link from "next/link";

import { requireAuth } from "@/auth.server";
import { assertWalletOwnership } from "@/lib/authorization";
import { updateWallet } from "@/app/actions/wallet";
import { walletTypeLabel } from "@/lib/labels";
import { WalletTypeSelector } from "@/components/WalletTypeSelector";

interface WalletEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function WalletEditPage({ params }: WalletEditPageProps) {
  const user = await requireAuth();
  const { id } = await params;
  const wallet = await assertWalletOwnership(id, user.id);

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/wallets" className="text-sm text-blue-600 hover:underline">
          ← 財布一覧へ戻る
        </Link>
      </div>

      <div className="card p-8">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold mb-4">財布情報の編集</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            現在のタイプ: {walletTypeLabel(wallet.type)}
          </p>
        </div>

        <form action={updateWallet} className="space-y-6">
          <input type="hidden" name="id" value={wallet.id} />

          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              財布名
            </label>
            <input
              id="name"
              type="text"
              name="name"
              defaultValue={wallet.name}
              placeholder="財布の名前（例：現金・楽天銀行）"
              className="input w-full"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="type" className="text-sm font-medium">
              タイプ
            </label>
            <WalletTypeSelector defaultValue={wallet.type} name="type" />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="btn-primary px-4 py-3">
              更新
            </button>
            <Link href="/wallets" className="btn-secondary px-4 py-3">
              キャンセル
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
