import { prisma } from "@/lib/db";
import { requireAuth } from "@/auth.server";
import { createSubscription, deleteSubscription } from "@/app/actions/subscription";
import { getCategoriesForUser, getWalletsForUser } from "@/lib/queries";

export default async function SubscriptionsPage() {
  const user = await requireAuth();

  const [subscriptions, categories, wallets] = await Promise.all([
    prisma.subscription.findMany({
      where: { wallet: { userId: user.id } },
      include: { category: true, wallet: true },
      orderBy: { billingDate: "asc" },
    }),
    getCategoriesForUser(user.id),
    getWalletsForUser(user.id),
  ]);

  const totalMonthly = subscriptions.reduce((sum, s) => sum + s.amount, 0);

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-2">
        <h1 className="font-display text-2xl font-bold">サブスク管理</h1>
      </div>
      <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
        月額合計：
        <span className="font-semibold ml-1" style={{ color: "var(--red-400)" }}>
          ¥{totalMonthly.toLocaleString()}
        </span>
      </p>

      <div className="card p-6 mb-8">
        <h2 className="text-sm font-medium mb-4" style={{ color: "var(--text-secondary)" }}>
          サブスクを追加
        </h2>
        <form action={createSubscription} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "サービス名", name: "name", type: "text", placeholder: "Netflix・Spotify等" },
              { label: "月額金額", name: "amount", type: "number", placeholder: "0" },
              { label: "引き落とし日", name: "billingDate", type: "number", placeholder: "1〜31" },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium mb-2"
                  style={{ color: "var(--text-secondary)" }}>{field.label}</label>
                <input type={field.type} name={field.name}
                  placeholder={field.placeholder} className="input" required />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}>カテゴリ</label>
              <select name="categoryId" className="select">
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}>財布</label>
              <select name="walletId" className="select">
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary w-full py-3">
            追加
          </button>
        </form>
      </div>

      <div className="space-y-3">
        {subscriptions.length === 0 ? (
          <p className="text-center py-12 text-sm" style={{ color: "var(--text-muted)" }}>
            サブスクがありません
          </p>
        ) : (
          subscriptions.map((s) => (
            <div key={s.id} className="card px-6 py-5 flex justify-between items-center">
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                  毎月{s.billingDate}日　・　{s.category.name}　・　{s.wallet.name}
                </p>
              </div>
              <div className="flex items-center gap-6">
                <p className="font-semibold" style={{ color: "var(--red-400)" }}>
                  ¥{s.amount.toLocaleString()}
                </p>
                <form action={deleteSubscription}>
                  <input type="hidden" name="id" value={s.id} />
                  <button type="submit" className="text-sm" style={{ color: "var(--red-400)" }}>
                    削除
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
