"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function CategoryFilter({
  categories,
}: {
  categories: { id: string; name: string; type?: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      params.set("categoryId", e.target.value);
    } else {
      params.delete("categoryId");
    }
    router.push(`/transactions?${params.toString()}`);
  };

  // detect duplicate names so we can disambiguate by type
  const nameCounts: Record<string, number> = {};
  categories.forEach((c) => {
    nameCounts[c.name] = (nameCounts[c.name] ?? 0) + 1;
  });

  return (
    <select
      onChange={handleChange}
      className="select ml-auto max-w-[220px]"
      defaultValue={searchParams.get("categoryId") ?? ""}
      style={{ width: "auto", minWidth: 100, maxWidth: "100%" }}
    >
      <option value="">絞り込み</option>
      {categories.map((c) => {
        const needsType = nameCounts[c.name] > 1;
        const typeLabel = c.type === "income" ? "（収入）" : c.type === "expense" ? "（支出）" : "";
        return (
          <option key={c.id} value={c.id}>
            {c.name}{needsType ? ` ${typeLabel}` : ""}
          </option>
        );
      })}
    </select>
  );
}
