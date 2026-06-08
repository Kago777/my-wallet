"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function CategoryFilter({
  categories,
}: {
  categories: { id: string; name: string }[];
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

  return (
    <select
      onChange={handleChange}
      className="border rounded px-4 py-2 ml-auto"
      defaultValue={searchParams.get("categoryId") ?? ""}
    >
      <option value="">カテゴリで絞り込み</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}