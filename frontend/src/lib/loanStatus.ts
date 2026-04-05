export type CanonicalLoanStatus =
  | "pending"
  | "approved"
  | "active"
  | "paid"
  | "closed"
  | "defaulted";

export type ScheduleLike = {
  dueDate?: string | Date;
  amount?: number;
  paidAmount?: number;
  status?: string;
};

export type LoanLike = {
  status?: string;
  schedule?: ScheduleLike[];
};

export const toStartOfDay = (value: Date) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate());

export const normalizeLoanStatus = (rawStatus: string | undefined): CanonicalLoanStatus => {
  const status = String(rawStatus || "").trim().toLowerCase();
  switch (status) {
    case "pending":
      return "pending";
    case "approved":
      return "approved";
    case "active":
      return "active";
    case "paid":
      return "paid";
    case "closed":
      return "closed";
    case "defaulted":
    case "overdue":
      return "defaulted";
    default:
      return "pending";
  }
};

export const getLoanStatusLabel = (status: string | undefined) => {
  switch (normalizeLoanStatus(status)) {
    case "pending":
      return "Pending";
    case "approved":
      return "Approved";
    case "active":
      return "Active";
    case "paid":
      return "Paid";
    case "closed":
      return "Closed";
    case "defaulted":
      return "Defaulted";
    default:
      return "Pending";
  }
};

export const getLoanScheduleStats = (loan: LoanLike, now: Date = new Date()) => {
  const schedule = loan.schedule || [];
  const normalizedNow = toStartOfDay(now);

  const outstanding = schedule.reduce((sum, item) => {
    const remaining = Math.max(0, Number(item.amount || 0) - Number(item.paidAmount || 0));
    return sum + remaining;
  }, 0);

  const totalPaid = schedule.reduce((sum, item) => sum + Number(item.paidAmount || 0), 0);

  const unpaid = schedule.filter(
    (item) => Math.max(0, Number(item.amount || 0) - Number(item.paidAmount || 0)) > 0
  );

  const overdueItems = unpaid.filter((item) => {
    const dueDate = item.dueDate ? toStartOfDay(new Date(item.dueDate)) : null;
    return !!dueDate && dueDate < normalizedNow;
  });

  const dueSoon = unpaid.some((item) => {
    if (!item.dueDate) return false;
    const dueDate = toStartOfDay(new Date(item.dueDate));
    const diff = Math.floor((dueDate.getTime() - normalizedNow.getTime()) / (24 * 60 * 60 * 1000));
    return diff >= 0 && diff <= 7;
  });

  const daysLate = overdueItems.reduce((maxLate, item) => {
    if (!item.dueDate) return maxLate;
    const dueDate = toStartOfDay(new Date(item.dueDate));
    const diff = Math.floor((normalizedNow.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000));
    return Math.max(maxLate, diff);
  }, 0);

  const lastDueDate = schedule.reduce<Date | null>((latest, item) => {
    if (!item.dueDate) return latest;
    const dueDate = new Date(item.dueDate);
    if (!latest || dueDate > latest) return dueDate;
    return latest;
  }, null);

  const pastMaturity = !!lastDueDate && toStartOfDay(lastDueDate) < normalizedNow && outstanding > 0;

  return {
    outstanding,
    totalPaid,
    hasOverdue: overdueItems.length > 0,
    overdueItems,
    daysLate,
    dueSoon,
    hasMissed: overdueItems.length > 0,
    pastMaturity
  };
};

export const toHomeLoanStatus = (loan: LoanLike, now: Date = new Date()) => {
  const status = normalizeLoanStatus(loan.status);
  const stats = getLoanScheduleStats(loan, now);

  if (stats.hasOverdue) return "Defaulted" as const;
  if (status === "paid" || status === "closed") return "Fully Paid" as const;
  if (status === "approved" || status === "active") return "Open" as const;
  return "Pending" as const;
};
