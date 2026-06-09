export type Period = { label: string; start: Date; end: Date };

export function buildPeriods(granularity: string, now = new Date()): Period[] {
  if (granularity === "month") {
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      return { label: `${d.getMonth() + 1}月`, start: d, end };
    });
  }

  if (granularity === "week") {
    return Array.from({ length: 12 }, (_, i) => {
      const start = new Date(now);
      start.setDate(now.getDate() - (11 - i) * 7);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      return {
        label: `${start.getMonth() + 1}/${start.getDate()}`,
        start,
        end,
      };
    });
  }

  if (granularity === "3days") {
    return Array.from({ length: 12 }, (_, i) => {
      const start = new Date(now);
      start.setDate(now.getDate() - (11 - i) * 3);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 3);
      return {
        label: `${start.getMonth() + 1}/${start.getDate()}`,
        start,
        end,
      };
    });
  }

  return [];
}

export function aggregateByPeriods(
  transactions: { type: string; amount: number; date: Date }[],
  periods: Period[]
) {
  return periods.map(({ label, start, end }) => {
    let income = 0;
    let expense = 0;

    for (const t of transactions) {
      const date = new Date(t.date);
      if (date < start || date >= end) continue;
      if (t.type === "income") income += t.amount;
      else if (t.type === "expense") expense += t.amount;
    }

    return { label, income, expense };
  });
}
