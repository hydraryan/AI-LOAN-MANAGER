import { Request, Response } from "express";
import { Loan, Borrower, Savings, Transaction } from "../models";

const safeReportError = (res: Response, scope: string, err: unknown) => {
  console.error(`${scope} error`, err);
  return res.status(500).json({ error: "Failed to generate report metrics" });
};

const formatDay = (date: Date) =>
  date.toLocaleDateString("en-IN", { weekday: "short" });

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    const loans = await Loan.find().lean();
    const borrowers = await Borrower.find().lean();
    const savings = await Savings.find().lean();

    // 💰 Total Disbursement
    const totalDisbursement = loans.reduce((sum, l) => sum + l.principal, 0);

    // 👥 Active Borrowers
    const activeBorrowers = borrowers.length;

    // 💳 Total Savings
    const totalSavings = savings.reduce((sum, s) => sum + s.balance, 0);

    // 📊 Loan Status Distribution
    const statusMap: any = {};
    loans.forEach((l) => {
      statusMap[l.status] = (statusMap[l.status] || 0) + 1;
    });

    const loanStatus = Object.keys(statusMap).map((k) => ({
      name: k,
      value: statusMap[k]
    }));

    res.json({
      totalDisbursement,
      activeBorrowers,
      totalSavings,
      loanStatus
    });
  } catch (err: any) {
    return safeReportError(res, "getDashboardStats", err);
  }
};

export const getHomeDashboardMetrics = async (_req: Request, res: Response) => {
  try {
    const loans = await Loan.find().select("status principal schedule").lean();
    const loanTransactions: any[] = await Transaction.find({ loanId: { $exists: true, $ne: null } } as any)
      .select("amount status postedDate createdAt")
      .lean();

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    let dueTodayCount = 0;
    let dueTodayAmount = 0;
    let overdueCount = 0;
    let overdueAmount = 0;

    let overdue1to30 = 0;
    let overdue31to90 = 0;
    let overdue90Plus = 0;
    let scheduledPaidToday = 0;

    let totalOutstanding = 0;
    let overdueOutstanding = 0;

    for (const loan of loans) {
      for (const installment of (loan as any).schedule || []) {
        const dueDate = new Date(installment.dueDate);
        const due = Number(installment.amount || 0);
        const paid = Number(installment.paidAmount || 0);
        const unpaid = Math.max(due - paid, 0);

        if (dueDate >= todayStart && dueDate <= todayEnd && paid > 0) {
          scheduledPaidToday += paid;
        }

        totalOutstanding += unpaid;

        if (unpaid <= 0) {
          continue;
        }

        if (dueDate >= todayStart && dueDate <= todayEnd && installment.status !== "paid") {
          dueTodayCount += 1;
          dueTodayAmount += unpaid;
        }

        if (dueDate < todayStart && installment.status !== "paid") {
          overdueCount += 1;
          overdueAmount += unpaid;
          overdueOutstanding += unpaid;

          const diffMs = todayStart.getTime() - startOfDay(dueDate).getTime();
          const overdueDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

          if (overdueDays <= 30) {
            overdue1to30 += unpaid;
          } else if (overdueDays <= 90) {
            overdue31to90 += unpaid;
          } else {
            overdue90Plus += unpaid;
          }
        }
      }
    }

    const transactionTodayCollection = loanTransactions
      .filter((t: any) => {
        const posted = new Date(t.postedDate || t.createdAt);
        const status = String(t.status || "").toLowerCase();
        return posted >= todayStart && posted <= todayEnd && (status === "approved" || status === "success");
      })
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const todayCollection = transactionTodayCollection > 0 ? transactionTodayCollection : scheduledPaidToday;

    const pendingApprovalLoans = loans.filter(
      (l) => String(l.status || "").toLowerCase() === "pending"
    );

    const pendingApprovalCount = pendingApprovalLoans.length;
    const pendingApprovalValue = pendingApprovalLoans.reduce(
      (sum, l) => sum + Number(l.principal || 0),
      0
    );

    const pendingRepayments = loanTransactions.filter(
      (t: any) => String(t.status || "").toLowerCase() === "pending"
    );

    const pendingRepaymentsCount = pendingRepayments.length;
    const pendingRepaymentsValue = pendingRepayments.reduce(
      (sum, t) => sum + Number(t.amount || 0),
      0
    );

    const portfolioAtRisk =
      totalOutstanding > 0 ? (overdueOutstanding / totalOutstanding) * 100 : 0;

    const trendMap = new Map<string, { day: string; expected: number; actual: number }>();
    for (let i = 6; i >= 0; i -= 1) {
      const d = startOfDay(new Date(now.getTime() - i * 24 * 60 * 60 * 1000));
      const key = d.toISOString().slice(0, 10);
      trendMap.set(key, { day: formatDay(d), expected: 0, actual: 0 });
    }

    for (const loan of loans) {
      for (const installment of (loan as any).schedule || []) {
        const dueDate = startOfDay(new Date(installment.dueDate));
        const key = dueDate.toISOString().slice(0, 10);
        const row = trendMap.get(key);
        if (row) {
          row.expected += Number(installment.amount || 0);
        }
      }
    }

    for (const t of loanTransactions) {
      const status = String(t.status || "").toLowerCase();
      if (!(status === "approved" || status === "success")) continue;

      const postedAt = startOfDay(new Date(t.postedDate || t.createdAt));
      const key = postedAt.toISOString().slice(0, 10);
      const row = trendMap.get(key);
      if (row) {
        row.actual += Number(t.amount || 0);
      }
    }

    const collectionTrend = Array.from(trendMap.values());

    res.json({
      todayCollection,
      portfolioAtRisk,
      collectionTrend,
      overdueBuckets: {
        d1to30: overdue1to30,
        d31to90: overdue31to90,
        d90plus: overdue90Plus
      },
      actionItems: [
        {
          label: "EMIs Due Today",
          count: dueTodayCount,
          value: dueTodayAmount,
          critical: true
        },
        {
          label: "Missed Repayments",
          count: overdueCount,
          value: overdueAmount,
          critical: true
        },
        {
          label: "Loans Pending Approval",
          count: pendingApprovalCount,
          value: pendingApprovalValue,
          critical: false
        },
        {
          label: "Repayments Waiting",
          count: pendingRepaymentsCount,
          value: pendingRepaymentsValue,
          critical: false
        }
      ]
    });
  } catch (err: any) {
    return safeReportError(res, "getHomeDashboardMetrics", err);
  }
};