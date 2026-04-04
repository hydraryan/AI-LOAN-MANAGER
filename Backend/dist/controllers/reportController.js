"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHomeDashboardMetrics = exports.getDashboardStats = void 0;
const models_1 = require("../models");
const formatDay = (date) => date.toLocaleDateString("en-IN", { weekday: "short" });
const startOfDay = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};
const endOfDay = (date) => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
};
const getDashboardStats = async (_req, res) => {
    try {
        const loans = await models_1.Loan.find();
        const borrowers = await models_1.Borrower.find();
        const savings = await models_1.Savings.find();
        // 💰 Total Disbursement
        const totalDisbursement = loans.reduce((sum, l) => sum + l.principal, 0);
        // 👥 Active Borrowers
        const activeBorrowers = borrowers.length;
        // 💳 Total Savings
        const totalSavings = savings.reduce((sum, s) => sum + s.balance, 0);
        // 📊 Loan Status Distribution
        const statusMap = {};
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
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getDashboardStats = getDashboardStats;
const getHomeDashboardMetrics = async (_req, res) => {
    try {
        const loans = await models_1.Loan.find();
        const transactions = await models_1.Transaction.find();
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
        let totalOutstanding = 0;
        let overdueOutstanding = 0;
        for (const loan of loans) {
            for (const installment of loan.schedule || []) {
                const dueDate = new Date(installment.dueDate);
                const due = Number(installment.amount || 0);
                const paid = Number(installment.paidAmount || 0);
                const unpaid = Math.max(due - paid, 0);
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
                    }
                    else if (overdueDays <= 90) {
                        overdue31to90 += unpaid;
                    }
                    else {
                        overdue90Plus += unpaid;
                    }
                }
            }
        }
        const todayCollection = transactions
            .filter((t) => {
            const createdAt = new Date(t.createdAt);
            return createdAt >= todayStart && createdAt <= todayEnd;
        })
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);
        const pendingApprovalLoans = loans.filter((l) => String(l.status || "").toLowerCase() === "pending");
        const pendingApprovalCount = pendingApprovalLoans.length;
        const pendingApprovalValue = pendingApprovalLoans.reduce((sum, l) => sum + Number(l.principal || 0), 0);
        const pendingRepayments = transactions.filter((t) => String(t.status || "").toLowerCase() === "pending");
        const pendingRepaymentsCount = pendingRepayments.length;
        const pendingRepaymentsValue = pendingRepayments.reduce((sum, t) => sum + Number(t.amount || 0), 0);
        const portfolioAtRisk = totalOutstanding > 0 ? (overdueOutstanding / totalOutstanding) * 100 : 0;
        const trendMap = new Map();
        for (let i = 6; i >= 0; i -= 1) {
            const d = startOfDay(new Date(now.getTime() - i * 24 * 60 * 60 * 1000));
            const key = d.toISOString().slice(0, 10);
            trendMap.set(key, { day: formatDay(d), expected: 0, actual: 0 });
        }
        for (const loan of loans) {
            for (const installment of loan.schedule || []) {
                const dueDate = startOfDay(new Date(installment.dueDate));
                const key = dueDate.toISOString().slice(0, 10);
                const row = trendMap.get(key);
                if (row) {
                    row.expected += Number(installment.amount || 0);
                }
            }
        }
        for (const t of transactions) {
            const createdAt = startOfDay(new Date(t.createdAt));
            const key = createdAt.toISOString().slice(0, 10);
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
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getHomeDashboardMetrics = getHomeDashboardMetrics;
//# sourceMappingURL=reportController.js.map