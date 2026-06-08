"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const GRANULARITIES = [
  { label: "月", value: "month" },
  { label: "週", value: "week" },
  { label: "3日", value: "3days" },
];

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; fill: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg px-4 py-3 text-sm"
      style={{ background: "var(--navy-700)", border: "1px solid var(--navy-600)" }}>
      <p className="font-medium mb-2" style={{ color: "var(--text-secondary)" }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.fill }}>
          {p.name}：¥{p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

export default function MonthlyChart({
  data,
  granularity,
}: {
  data: { label: string; income: number; expense: number }[];
  granularity: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleGranularity = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("granularity", value);
    router.push(`/?${params.toString()}`);
  };

  return (
    <div>
      {/* 粒度切り替え */}
      <div className="flex gap-2 mb-4">
        {GRANULARITIES.map((g) => (
          <button
            key={g.value}
            onClick={() => handleGranularity(g.value)}
            className="px-3 py-1 rounded-md text-xs transition-colors"
            style={{
              background: granularity === g.value ? "var(--emerald-500)" : "var(--navy-700)",
              color: granularity === g.value ? "#fff" : "var(--text-muted)",
              border: "1px solid var(--navy-600)",
            }}>
            {g.label}
          </button>
        ))}
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>
          データがありません
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} barSize={16} barGap={4}
            margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#253347" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "#64748B", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`}
              tick={{ fill: "#64748B", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
            />
            <Bar dataKey="income" name="収入" fill="#34D399" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="支出" fill="#F87171" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}