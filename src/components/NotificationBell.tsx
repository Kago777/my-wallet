"use client";

import { useState } from "react";
import { Bell, X, Check, CheckCheck, Trash2 } from "lucide-react";
import { markReminderAsRead, deleteReminder, markAllRemindersAsRead, createTransactionFromReminder } from "@/app/actions/reminder";

type Reminder = {
  id: string;
  type: "bill_input" | "subscription_review" | "reconciliation" | "asset_check";
  title: string;
  description?: string | null;
  isRead: boolean;
  createdAt: Date;
  recurringBill?: {
    id: string;
    transactions: {
      id: string;
      amount: number;
    }[];
  } | null;
};

const TYPE_LABEL = {
  bill_input: "入力が必要",
  subscription_review: "確認が必要",
  reconciliation: "残高照合",
  asset_check: "資産確認",
};

export default function NotificationBell({ reminders }: { reminders: Reminder[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const unreadCount = reminders.filter((r) => !r.isRead).length;

  const handleCreateTransaction = async (reminderId: string) => {
    const amount = amounts[reminderId];
    if (!amount) return;
    setLoading((prev) => ({ ...prev, [reminderId]: true }));
    const formData = new FormData();
    formData.append("amount", amount);
    await createTransactionFromReminder(reminderId, formData);
    setLoading((prev) => ({ ...prev, [reminderId]: false }));
  };

  return (
    <>
      {/* 通知アイコン */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative flex items-center hover:opacity-80 transition-opacity"
        style={{ color: "var(--text-secondary)" }}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 flex items-center justify-center rounded-full text-white"
            style={{
              background: "var(--red-400)",
              fontSize: "10px",
              minWidth: "16px",
              height: "16px",
              padding: "0 3px",
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* スライドパネル */}
      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col"
        style={{
          width: "min(360px, 100vw)",
          background: "var(--navy-800)",
          borderLeft: "1px solid var(--navy-600)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s ease",
        }}
      >
        {/* ヘッダー */}
        <div
          className="flex justify-between items-center px-5 py-4"
          style={{ borderBottom: "1px solid var(--navy-600)" }}
        >
          <p className="font-medium text-sm">通知</p>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRemindersAsRead()}
                className="text-xs flex items-center gap-1 hover:opacity-80"
                style={{ color: "var(--text-muted)" }}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                全て既読
              </button>
            )}
            <button onClick={() => setIsOpen(false)} style={{ color: "var(--text-muted)" }}>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* リマインダー一覧 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {reminders.length === 0 ? (
            <p className="text-center py-12 text-sm" style={{ color: "var(--text-muted)" }}>
              通知はありません
            </p>
          ) : (
            reminders.map((r) => (
              <div
                key={r.id}
                className="rounded-xl p-4"
                style={{
                  background: r.isRead ? "var(--navy-900)" : "var(--navy-700)",
                  border: "1px solid var(--navy-600)",
                }}
              >
                <div className="flex justify-between items-start gap-2 mb-1">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "var(--navy-600)", color: "var(--text-muted)" }}
                  >
                    {TYPE_LABEL[r.type]}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!r.isRead && (
                      <button
                        onClick={() => markReminderAsRead(r.id)}
                        className="hover:opacity-80"
                        style={{ color: "var(--emerald-400)" }}
                        title="既読にする"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteReminder(r.id)}
                      className="hover:opacity-80"
                      style={{ color: "var(--text-muted)" }}
                      title="削除"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

               <p className="text-sm font-medium mt-2">{r.title}</p>
                {r.description && (
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    {r.description}
                </p>
                )}
                {/* 日付を追加 */}
                <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                {new Date(r.createdAt).toLocaleDateString("ja-JP")}
                </p>

                {/* bill_inputのみ金額入力欄を表示 */}
                {r.type === "bill_input" && (() => {
                const existingTx = r.recurringBill?.transactions[0];

                if (existingTx) {
                    return (
                    <div className="flex items-center justify-between mt-3">
                        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                        記録済み: ¥{existingTx.amount.toLocaleString()}
                        </span>
                        <a
                        href={`/transactions/${existingTx.id}/edit`}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{
                            background: "var(--navy-600)",
                            color: "var(--text-secondary)",
                            border: "1px solid var(--navy-600)",
                        }}
                        >
                        編集
                        </a>
                    </div>
                    );
                }

                return (
                    <div className="flex gap-2 mt-3">
                    <div className="flex items-center flex-1 rounded-lg px-3"
                        style={{ background: "var(--navy-900)", border: "1px solid var(--navy-600)" }}>
                        <span className="text-sm mr-1" style={{ color: "var(--text-muted)" }}>¥</span>
                        <input
                        type="number"
                        placeholder="金額"
                        value={amounts[r.id] ?? ""}
                        onChange={(e) => setAmounts((prev) => ({ ...prev, [r.id]: e.target.value }))}
                        className="flex-1 bg-transparent outline-none text-sm py-2"
                        style={{ color: "var(--text-primary)" }}
                        />
                    </div>
                    <button
                        onClick={() => handleCreateTransaction(r.id)}
                        disabled={!amounts[r.id] || loading[r.id]}
                        className="px-3 py-2 rounded-lg text-xs font-medium"
                        style={{
                        background: amounts[r.id] ? "var(--emerald-500)" : "var(--navy-600)",
                        color: "#fff",
                        opacity: loading[r.id] ? 0.7 : 1,
                        }}
                    >
                        {loading[r.id] ? "..." : "記録"}
                    </button>
                    </div>
                );
                })()}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}