"use client";

type BankWallet = {
  id: string;
  name: string;
};

type CreditCardSettingValues = {
  billingDay: number;
  closingDay: number | null;
  settlementWalletId: string;
  billingMonthOffset: number;
};

type Props = {
  bankWallets: BankWallet[];
  defaultValues?: CreditCardSettingValues;
};

export function CreditCardSettingForm({ bankWallets, defaultValues }: Props) {
  return (
    <div
      className="space-y-4 rounded-xl p-4"
      style={{ background: "var(--navy-700)", border: "1px solid var(--navy-600)" }}
    >
      <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
        クレジットカード設定
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="billingDay" className="text-xs" style={{ color: "var(--text-muted)" }}>
            引き落とし日
          </label>
          <input
            id="billingDay"
            type="number"
            name="billingDay"
            min={1}
            max={31}
            defaultValue={defaultValues?.billingDay ?? 27}
            className="input w-full"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="closingDay" className="text-xs" style={{ color: "var(--text-muted)" }}>
            締め日（空欄=月末）
          </label>
          <input
            id="closingDay"
            type="number"
            name="closingDay"
            min={1}
            max={31}
            defaultValue={defaultValues?.closingDay ?? ""}
            className="input w-full"
            placeholder="月末締め"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="settlementWalletId" className="text-xs" style={{ color: "var(--text-muted)" }}>
          引き落とし口座
        </label>
        <select
          id="settlementWalletId"
          name="settlementWalletId"
          className="select w-full"
          defaultValue={defaultValues?.settlementWalletId ?? bankWallets[0]?.id ?? ""}
          required
        >
          {bankWallets.length === 0 ? (
            <option value="">銀行口座がありません</option>
          ) : (
            bankWallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="space-y-2">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          引き落としタイミング
        </p>
        <div className="flex gap-2">
          <label
            className="flex-1 text-center py-2 rounded-lg text-sm cursor-pointer"
            style={{
              background:
                (defaultValues?.billingMonthOffset ?? 1) === 1
                  ? "var(--navy-400)"
                  : "var(--navy-800)",
              border: "1px solid var(--navy-600)",
            }}
          >
            <input
              type="radio"
              name="billingMonthOffset"
              value="1"
              defaultChecked={(defaultValues?.billingMonthOffset ?? 1) === 1}
              className="sr-only"
            />
            翌月引き落とし
          </label>
          <label
            className="flex-1 text-center py-2 rounded-lg text-sm cursor-pointer"
            style={{
              background:
                defaultValues?.billingMonthOffset === 2
                  ? "var(--navy-400)"
                  : "var(--navy-800)",
              border: "1px solid var(--navy-600)",
            }}
          >
            <input
              type="radio"
              name="billingMonthOffset"
              value="2"
              defaultChecked={defaultValues?.billingMonthOffset === 2}
              className="sr-only"
            />
            翌々月引き落とし
          </label>
        </div>
      </div>
    </div>
  );
}
