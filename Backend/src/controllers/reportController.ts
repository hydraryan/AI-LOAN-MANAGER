import { Request, Response } from "express";
import { Loan, Borrower, Savings } from "../models";

export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    const loans = await Loan.find();
    const borrowers = await Borrower.find();
    const savings = await Savings.find();

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
    res.status(500).json({ error: err.message });
  }
};