"use client";

import { useEffect, useState } from "react";

const WALLET_TYPES = [
  { value: "cash", label: "現金" },
  { value: "bank", label: "銀行" },
  { value: "credit", label: "クレジット" },
] as const;

type WalletType = typeof WALLET_TYPES[number]["value"];

export function WalletTypeSelector({
  value,
  defaultValue = "cash",
  onChange,
  name,
}: {
  value?: WalletType;
  defaultValue?: WalletType;
  onChange?: (value: WalletType) => void;
  name?: string;
}) {
  const [selected, setSelected] = useState<WalletType>(value ?? defaultValue);

  useEffect(() => {
    if (value !== undefined) {
      setSelected(value);
    }
  }, [value]);

  const handleSelect = (type: WalletType) => {
    setSelected(type);
    onChange?.(type);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 overflow-x-auto py-1 scrollbar-hidden">
        {WALLET_TYPES.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => handleSelect(type.value)}
            className={`btn-filter ${
              selected === type.value ? "btn-filter-active" : "btn-filter-inactive"
            } whitespace-nowrap`}
          >
            {type.label}
          </button>
        ))}
      </div>
      {name ? <input id={name} type="hidden" name={name} value={selected} /> : null}
    </div>
  );
}
