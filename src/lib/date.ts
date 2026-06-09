export function getMonthRange(month: string): { start: Date; end: Date } {
  const start = new Date(`${month}-01`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  return { start, end };
}
