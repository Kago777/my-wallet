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
  const activeType = searchParams.get("type") ?? "";
  const activeCategoryId = searchParams.get("categoryId") ?? "";

  const navigate = (type: string | null, categoryId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (type) {
      params.set("type", type);
    } else {
      params.delete("type");
    }
    if (categoryId) {
      params.set("categoryId", categoryId);
    } else {
      params.delete("categoryId");
    }
    router.push(`/transactions?${params.toString()}`);
  };

  // Recursively walk up to find the root parent of a category
  const findRootParent = (id: string): Category | undefined => {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return undefined;
    if (!cat.parentId) return cat;
    return findRootParent(cat.parentId);
  };

  // Active color based on selected type
  const activeColor =
    activeType === "expense"
      ? "var(--red-400)"
      : activeType === "income"
        ? "var(--emerald-500)"
        : "var(--navy-400)";

  // Level 2: root parent categories filtered by active type
  const parentCategories =
    activeType === "expense" || activeType === "income"
      ? categories.filter((c) => !c.parentId && c.type === activeType)
      : [];

  // Determine the active root parent from activeCategoryId
  const activeRootParent = activeCategoryId
    ? findRootParent(activeCategoryId)
    : undefined;

  const isParentActive = (parentId: string) =>
    activeRootParent?.id === parentId;

  // Level 3: children of the active root parent
  const level3 = activeRootParent
    ? categories.filter((c) => c.parentId === activeRootParent.id)
    : [];

  // Determine which level-3 item is active/expanded
  const selectedCategory = categories.find((c) => c.id === activeCategoryId);
  const level3ActiveId = (() => {
    if (!activeCategoryId || !activeRootParent) return null;
    // activeCategoryId is a direct child of root → it IS the level-3 item
    if (selectedCategory?.parentId === activeRootParent.id) return activeCategoryId;
    // activeCategoryId is a grandchild → its parent is the level-3 item
    const parent = categories.find((c) => c.id === selectedCategory?.parentId);
    if (parent?.parentId === activeRootParent.id) return parent.id;
    return null;
  })();

  // Level 4: children of the active level-3 item
  const level4 = level3ActiveId
    ? categories.filter((c) => c.parentId === level3ActiveId)
    : [];

  return (
    <div className="w-72 sm:w-auto">
      {/* タイプ選択行 */}
      <div className="overflow-x-auto pb-2 scrollbar-hidden mb-2">
        <div className="flex gap-2 min-w-max">
          {[
            { label: "すべて", value: "", color: "var(--navy-400)" },
            { label: "支出", value: "expense", color: "var(--red-400)" },
            { label: "収入", value: "income", color: "var(--emerald-500)" },
            { label: "振替", value: "transfer", color: "var(--navy-400)" },
          ].map((item) => {
            const isActive =
              activeType === item.value || (!activeType && !item.value);
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => navigate(item.value || null, null)}
                className="flex-shrink-0 px-4 py-2 rounded-full text-sm transition-colors whitespace-nowrap"
                style={{
                  background: isActive ? item.color : "var(--navy-700)",
                  color: isActive ? "#fff" : "var(--text-secondary)",
                  border: "1px solid var(--navy-600)",
                }}>
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2階層目: タイプでフィルターされた親カテゴリ */}
      {activeType !== "transfer" && parentCategories.length > 0 && (
        <div className="overflow-x-auto pb-2 scrollbar-hidden mb-2">
          <div className="flex gap-2 min-w-max">
            {parentCategories.map((c) => {
              const active = isParentActive(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => navigate(activeType, c.id)}
                  className="flex-shrink-0 px-4 py-2 rounded-full text-sm transition-colors whitespace-nowrap"
                  style={{
                    background: active ? activeColor : "var(--navy-700)",
                    color: active ? "#fff" : "var(--text-secondary)",
                    border: "1px solid var(--navy-600)",
                  }}>
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3階層目: アクティブな親カテゴリの子 */}
      {activeType !== "transfer" && level3.length > 0 && (
        <div className="overflow-x-auto pb-2 scrollbar-hidden mb-2">
          <div className="flex gap-2 min-w-max">
            {level3.map((c) => {
              const active = c.id === level3ActiveId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => navigate(activeType, c.id)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs transition-colors whitespace-nowrap"
                  style={{
                    background: active ? activeColor : "var(--navy-800)",
                    color: active ? "#fff" : "var(--text-secondary)",
                    border: "1px solid var(--navy-600)",
                  }}>
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4階層目: アクティブな3階層目カテゴリの子 */}
      {activeType !== "transfer" && level4.length > 0 && (
        <div className="overflow-x-auto pb-2 scrollbar-hidden">
          <div className="flex gap-2 min-w-max">
            {level4.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => navigate(activeType, c.id)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs transition-colors whitespace-nowrap"
                style={{
                  background:
                    activeCategoryId === c.id ? activeColor : "var(--navy-800)",
                  color:
                    activeCategoryId === c.id ? "#fff" : "var(--text-muted)",
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
