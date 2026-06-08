"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"];

export default function DashboardChart({
  data,
}: {
  data: { name: string; amount: number }[];
}) {
  if (data.length === 0) {
    return <p className="text-gray-500 text-center py-8">データがありません</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="amount"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={({ name, percent }) =>
            `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
          }
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => 
          [`¥${Number(value ?? 0).toLocaleString()}`, "金額"]
        } />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}