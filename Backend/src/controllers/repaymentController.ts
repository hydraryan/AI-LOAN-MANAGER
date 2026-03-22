import { Request, Response } from "express";
import { Loan, Transaction } from "../models";
export const getRepayments = async (_req: Request, res: Response) => {
  try {
    const txns = await Transaction.find().populate({
      path: "loanId",
      populate: {
        path: "borrowerId",
        populate: { path: "userId" }
      }
    });

    const formatted = txns.map((t: any) => ({
      id: t._id,
      loanId: t.loanId?._id,
      borrowerName: t.loanId?.borrowerId?.userId?.name || "Unknown",
      amount: t.amount,
      date: t.createdAt,
      method: "System",
      status: t.status === "success" ? "Approved" : "Pending"
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
export const bulkRepayment = async (req: Request, res: Response) => {
  try {
    const { entries } = req.body;

    const results = [];

    for (const entry of entries) {
      const loan = await Loan.findById(entry.loanId);

      if (!loan) continue;

      let remaining = entry.amount;

      // 🔥 Apply payment to schedule
      for (const installment of loan.schedule) {
        if (installment.status === "paid") continue;

        const due = installment.amount - installment.paidAmount;

        if (remaining <= 0) break;

        const pay = Math.min(due, remaining);

        installment.paidAmount += pay;
        remaining -= pay;

        if (installment.paidAmount >= installment.amount) {
          installment.status = "paid";
        }
      }

      await loan.save();

      // 💳 record transaction
      await Transaction.create({
        loanId: loan._id,
        amount: entry.amount,
        status: "success"
      });

      results.push({ loanId: loan._id, paid: entry.amount });
    }

    res.json({ success: true, results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};