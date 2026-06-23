"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Category = {
  id: string;
  name: string;
  type?: string;
  parentId?: string | null;
};

export default function CategoryFilter({
  categories,
}: {
  categories: Category[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategoryId = searchParams.get("categoryId") ?? "";

  const handleSelect = (id: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id) {
      params.set("categoryId", id);
    } else {
      params.delete("categoryId");
    }
    router.push(`/transactions?${params.toString()}`);
  };

  const isParentActive = (parentId: string) =>
    activeCategoryId === parentId ||
    categories.find((c) => c.id === activeCategoryId)?.parentId === parentId ||
    categories.find((c) => {
      const parent = categories.find((p) => p.id === c.parentId);
      return c.id === activeCategoryId && parent?.parentId === parentId;
    }) !== undefined;

  const selectedCategory = categories.find((c) => c.id === activeCategoryId);
  const level2ParentId = selectedCategory?.parentId ?? activeCategoryId;
  const level2 = categories.filter((c) => c.parentId === level2ParentId);
  const level3 = selectedCategory?.parentId
    ? categories.filter((c) => c.parentId === activeCategoryId)
    : [];

  return (
    <div>
      {/* 1階層目 */}
      <div className="overflow-x-auto pb-2 scrollbar-hidden mb-2">
        <div className="flex gap-2 min-w-max">
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className="flex-shrink-0 px-4 py-2 rounded-full text-sm transition-colors whitespace-nowrap"
            style={{
              background: !activeCategoryId ? "var(--navy-400)" : "var(--navy-700)",
              color: !activeCategoryId ? "#fff" : "var(--text-secondary)",
              border: "1px solid var(--navy-600)",
            }}>
            すべて
          </button>
          {categories
            .filter((c) => !c.parentId)
            .map((c) => {
              const active = isParentActive(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelect(c.id)}
                  className="flex-shrink-0 px-4 py-2 rounded-full text-sm transition-colors whitespace-nowrap"
                  style={{
                    background: active ? "var(--navy-400)" : "var(--navy-700)",
                    color: active ? "#fff" : "var(--text-secondary)",
                    border: "1px solid var(--navy-600)",
                  }}>
                  {c.name}
                </button>
              );
            })}
        </div>
      </div>

      {/* 2階層目 */}
      {level2.length > 0 && (
        <div className="overflow-x-auto pb-2 scrollbar-hidden mb-2">
          <div className="flex gap-2 min-w-max">
            {level2.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelect(c.id)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs transition-colors whitespace-nowrap"
                style={{
                  background: activeCategoryId === c.id ? "var(--navy-400)" : "var(--navy-800)",
                  color: activeCategoryId === c.id ? "#fff" : "var(--text-secondary)",
                  border: "1px solid var(--navy-600)",
                }}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3階層目 */}
      {level3.length > 0 && (
        <div className="overflow-x-auto pb-2 scrollbar-hidden">
          <div className="flex gap-2 min-w-max">
            {level3.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelect(c.id)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs transition-colors whitespace-nowrap"
                style={{
                  background: activeCategoryId === c.id ? "var(--navy-400)" : "var(--navy-800)",
                  color: activeCategoryId === c.id ? "#fff" : "var(--text-muted)",
                  border: "1px solid var(--navy-700)",
                }}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
