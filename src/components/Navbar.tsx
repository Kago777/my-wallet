import Link from "next/link";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import Image from "next/image";
import { Menu, LogOut, User } from "lucide-react";
import DropdownMenu from "@/components/DropdownMenu";
import NotificationBell from "@/components/NotificationBell";

export default async function Navbar() {
  const session = await auth();
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

  const reminders = session?.user
    ? await prisma.reminder.findMany({
        where: { user: { email: session.user.email! } },
        orderBy: { createdAt: "desc" },
        include: {
          recurringBill: {
            include: {
              transactions: {
                where: {
                  date: { gte: monthStart, lte: monthEnd },
                },
                orderBy: { createdAt: "desc" },
                take: 1,
              },
            },
          },
        },
      })
    : [];
  return (
    <nav style={{ background: "var(--navy-800)", borderBottom: "1px solid var(--navy-600)" }}
      className="px-4 sm:px-8 py-2 sm:py-4">
      <div className="flex justify-between items-center">
        <Link href="/" className="font-display text-xl font-bold"
          style={{ color: "var(--emerald-400)" }}>
          Wallet
        </Link>

        <div className="flex items-center gap-3 sm:gap-6">
          <Link href="/transactions" style={{ color: "var(--text-secondary)", fontSize: "14px" }}
            className="hover:text-white transition-colors">
            収支
          </Link>

           <NotificationBell reminders={reminders} />
          {/* ハンバーガー */}
          {session?.user && (
            <DropdownMenu title="メニュー" trigger={
              <span style={{ color: "var(--text-secondary)" }}
                className="flex items-center hover:text-white transition-colors">
                <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
            }>
              <Link href="/wallets"
                style={{ color: "var(--text-secondary)", fontSize: "13px" }}
                className="block px-4 py-3 hover:bg-slate-700 transition-colors">
                財布管理
              </Link>
              <Link href="/subscriptions"
                style={{ color: "var(--text-secondary)", fontSize: "13px" }}
                className="block px-4 py-3 hover:bg-slate-700 transition-colors">
                サブスク管理
              </Link>
              <Link href="/recurring-bills"
                style={{ color: "var(--text-secondary)", fontSize: "13px" }}
                className="block px-4 py-3 hover:bg-slate-700 transition-colors">
                変動定期費用管理
              </Link>
              <Link href="/recurring-incomes"
                style={{ color: "var(--text-secondary)", fontSize: "13px" }}
                className="block px-4 py-3 hover:bg-slate-700 transition-colors">
                定期収入
              </Link>
              <Link href="/budgets"
                style={{ color: "var(--text-secondary)", fontSize: "13px" }}
                className="block px-4 py-3 hover:bg-slate-700 transition-colors">
                予算管理
              </Link>
            </DropdownMenu>
          )}
          {/* ユーザーアイコン */}
            {session?.user && (
            <DropdownMenu trigger={
              session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name ?? "user"}
                  width={32}
                  height={32}
                  className="rounded-full w-8 h-8 sm:w-10 sm:h-10"
                />
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center"
                  style={{ background: "var(--emerald-500)", color: "#fff" }}>
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              )
            }>
              <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--navy-600)" }}>
                <p className="text-sm font-medium">{session.user.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {session.user.email}
                </p>
              </div>
              <form action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}>
                <button type="submit"
                  className="w-full text-left px-4 py-3 text-sm flex items-center gap-2 hover:bg-slate-700 transition-colors"
                  style={{ color: "var(--red-400)" }}>
                  <LogOut size={14} />
                  ログアウト
                </button>
              </form>
            </DropdownMenu>
          )}
        </div>
      </div>
    </nav>
  );
}