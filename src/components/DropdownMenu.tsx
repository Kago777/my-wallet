"use client";

import { useState } from "react";
import { X } from "lucide-react";

export default function DropdownMenu({
  trigger,
  children,
  title,
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  title?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center">
        {trigger}
      </button>

      {/* オーバーレイ */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* スライドパネル */}
      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col"
        style={{
          width: "min(280px, 100vw)",
          background: "var(--navy-800)",
          borderLeft: "1px solid var(--navy-600)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s ease",
        }}
      >
        {/* ヘッダー */}
        <div
          className="flex justify-between items-center px-5 py-4"
          style={{ borderBottom: "1px solid var(--navy-600)" }}
        >
          <p className="font-medium text-sm">{title ?? "メニュー"}</p>
          <button onClick={() => setOpen(false)} style={{ color: "var(--text-muted)" }}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto py-2">
          {children}
        </div>
      </div>
    </>
  );
}