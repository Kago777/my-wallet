"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";

type Props = {
  editHref: string;
  deleteAction: (formData: FormData) => Promise<void>;
  deleteId: string;
  deleteMessage?: string;
  variant?: "mobile" | "desktop";
};

export default function TransactionActions({
  editHref,
  deleteAction,
  deleteId,
  deleteMessage = "削除しますか？",
  variant = "mobile",
}: Props) {
  const isMobile = variant === "mobile";

  return isMobile ? (
    // Mobile：横並びの2ボタン
    <div className="flex gap-2 w-full">
      <Link
        href={editHref}
        className="flex-1 text-center py-2 rounded-lg text-sm font-medium"
        style={{
          background: "var(--navy-700)",
          color: "var(--text-secondary)",
          border: "1px solid var(--navy-600)",
        }}
      >
        編集
      </Link>
      <form
        action={deleteAction}
        className="flex-1"
      >
        <input type="hidden" name="id" value={deleteId} />
        <button
          type="submit"
          onClick={(e) => {
            if (!window.confirm(deleteMessage)) e.preventDefault();
          }}
          className="w-full py-2 rounded-lg text-sm font-medium"
          style={{
            background: "rgba(248,113,113,0.1)",
            color: "var(--red-400)",
            border: "1px solid rgba(248,113,113,0.3)",
          }}
        >
          削除
        </button>
      </form>
    </div>
  ) : (
    // Desktop：アイコン付きテキストリンク
    <div className="flex gap-4 items-center">
      <Link
        href={editHref}
        className="flex items-center gap-1 hover:opacity-80"
        style={{ color: "var(--blue-400)" }}
      >
        <Pencil size={14} />編集
      </Link>
      <form action={deleteAction} className="inline">
        <input type="hidden" name="id" value={deleteId} />
        <button
          type="submit"
          onClick={(e) => {
            if (!window.confirm(deleteMessage)) e.preventDefault();
          }}
          className="flex items-center gap-1 hover:opacity-80"
          style={{ color: "var(--red-400)" }}
        >
          <Trash2 size={14} />削除
        </button>
      </form>
    </div>
  );
}