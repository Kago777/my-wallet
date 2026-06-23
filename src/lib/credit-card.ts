export function isBillingDayToday(today: Date, billingDay: number): boolean {
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  if (billingDay === today.getDate()) return true;
  if (billingDay > lastDayOfMonth && today.getDate() === lastDayOfMonth) return true;
  return false;
}

function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getClosingDateEnd(year: number, month: number, closingDay: number | null): Date {
  if (closingDay === null) {
    const lastDay = getLastDayOfMonth(year, month);
    return new Date(year, month, lastDay, 23, 59, 59, 999);
  }
  const day = Math.min(closingDay, getLastDayOfMonth(year, month));
  return new Date(year, month, day, 23, 59, 59, 999);
}

export function getBillingCycle(
  billingDate: Date,
  closingDay: number | null,
  billingMonthOffset: number
): { cycleStart: Date; cycleEnd: Date; billingMonthLabel: string } {
  const year = billingDate.getFullYear();
  const month = billingDate.getMonth();

  let closingMonth = month - billingMonthOffset;
  let closingYear = year;
  while (closingMonth < 0) {
    closingMonth += 12;
    closingYear -= 1;
  }

  if (closingDay === null) {
    const cycleStart = new Date(closingYear, closingMonth, 1, 0, 0, 0, 0);
    const cycleEnd = getClosingDateEnd(closingYear, closingMonth, null);
    return { cycleStart, cycleEnd, billingMonthLabel: `${closingMonth + 1}月` };
  }

  const cycleEnd = getClosingDateEnd(closingYear, closingMonth, closingDay);

  let prevClosingMonth = closingMonth - 1;
  let prevClosingYear = closingYear;
  if (prevClosingMonth < 0) {
    prevClosingMonth = 11;
    prevClosingYear -= 1;
  }
  const prevClosingEnd = getClosingDateEnd(prevClosingYear, prevClosingMonth, closingDay);
  const cycleStart = new Date(prevClosingEnd);
  cycleStart.setDate(cycleStart.getDate() + 1);
  cycleStart.setHours(0, 0, 0, 0);

  return { cycleStart, cycleEnd, billingMonthLabel: `${closingMonth + 1}月` };
}

export function calcBillingMonth(
  date: Date,
  closingDay: number | null
): { year: number; month: number } {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  if (closingDay === null) {
    return { year, month };
  }

  const effectiveClosingDay = Math.min(closingDay, getLastDayOfMonth(year, month));

  if (day > effectiveClosingDay) {
    return { year, month };
  }

  let prevMonth = month - 1;
  let prevYear = year;
  if (prevMonth < 0) {
    prevMonth = 11;
    prevYear -= 1;
  }
  return { year: prevYear, month: prevMonth };
}
