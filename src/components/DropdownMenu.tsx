"use client";

import { useState, useRef, useEffect } from "react";

export default function DropdownMenu({
  trigger,
  children,
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="flex items-center">
        {trigger}
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-50 w-48 rounded-lg overflow-hidden"
          style={{ background: "var(--navy-800)", border: "1px solid var(--navy-600)" }}>
          {children}
        </div>
      )}
    </div>
  );
}