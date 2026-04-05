import { Request, Response } from "express";
import TermDeposit from "../models/TermDeposit";

// Calculate compound interest
const calculateCompoundInterest = (
  principal: number,
  rate: number,
  frequency: "Monthly" | "Quarterly" | "Annually",
  days: number
): number => {
  const n =
    frequency === "Monthly" ? 12 : frequency === "Quarterly" ? 4 : 1;
  const years = days / 365;
  const amount = principal * Math.pow(1 + rate / 100 / n, n * years);
  return amount;
};

export const createTermDeposit = async (req: Request, res: Response) => {
  try {
    const {
      borrowerId,
      accountNumber,
      principalAmount,
      depositDate,
      maturityDate,
      interestRate,
      compoundingFrequency,
      autoRenewal
    } = req.body;

    if (!borrowerId || !accountNumber || !principalAmount || !maturityDate) {
      return res.status(400).json({
        error: "borrowerId, accountNumber, principalAmount, and maturityDate are required"
      });
    }

    const deposit = new TermDeposit({
      borrowerId,
      accountNumber,
      principalAmount: Number(principalAmount),
      depositDate: depositDate ? new Date(depositDate) : new Date(),
      maturityDate: new Date(maturityDate),
      interestRate: Number(interestRate) || 5,
      compoundingFrequency: compoundingFrequency || "Quarterly",
      autoRenewal: autoRenewal || false
    });

    // Calculate initial current value
    const days =
      (new Date(maturityDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24);
    deposit.currentValue = calculateCompoundInterest(
      Number(principalAmount),
      Number(interestRate) || 5,
      compoundingFrequency || "Quarterly",
      Math.max(1, days)
    );

    await deposit.save();
    res.status(201).json(deposit);
  } catch (err: any) {
    if (err?.code === 11000) {
      return res.status(400).json({ error: "Account number already exists" });
    }
    res.status(500).json({ error: err.message });
  }
};

export const getTermDeposits = async (req: Request, res: Response) => {
  try {
    const {
      status,
      search,
      sort = "createdAt",
      order = "desc",
      page = "1",
      limit = "20"
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [{ accountNumber: new RegExp(search as string, "i") }];
    }

    const sortObj: any = {};
    const sortField =
      sort === "maturityDate" || sort === "principalAmount"
        ? sort
        : "createdAt";
    sortObj[sortField] = order === "asc" ? 1 : -1;

    const data = await TermDeposit.find(filter)
      .populate({
        path: "borrowerId",
        select: "userId name",
        populate: { path: "userId", select: "name" }
      })
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    const total = await TermDeposit.countDocuments(filter);

    const formatted = data.map((d: any) => ({
      id: d._id,
      accountNumber: d.accountNumber,
      borrowerName: d.borrowerId?.userId?.name || d.borrowerId?.name,
      principalAmount: d.principalAmount,
      depositDate: d.depositDate,
      maturityDate: d.maturityDate,
      interestRate: d.interestRate,
      compoundingFrequency: d.compoundingFrequency,
      currentValue: d.currentValue,
      status: d.status,
      autoRenewal: d.autoRenewal
    }));

    res.json({
      data: formatted,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateTermDeposit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { principalAmount, interestRate, status, autoRenewal } = req.body;

    const updateData: any = {};
    if (principalAmount !== undefined)
      updateData.principalAmount = Number(principalAmount);
    if (interestRate !== undefined)
      updateData.interestRate = Number(interestRate);
    if (status) updateData.status = status;
    if (autoRenewal !== undefined) updateData.autoRenewal = autoRenewal;

    const updated = await TermDeposit.findByIdAndUpdate(id, updateData, {
      new: true
    }).populate({
      path: "borrowerId",
      populate: { path: "userId" }
    });

    if (!updated) {
      return res.status(404).json({ error: "Term deposit not found" });
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteTermDeposit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await TermDeposit.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Term deposit not found" });
    }

    res.json({ message: "Term deposit deleted successfully", id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const renewTermDeposit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newMaturityDate, principalAmount } = req.body;

    const original = await TermDeposit.findById(id);
    if (!original) {
      return res.status(404).json({ error: "Term deposit not found" });
    }

    const newDeposit = new TermDeposit({
      borrowerId: original.borrowerId,
      accountNumber: `${original.accountNumber}-RENEW`,
      principalAmount: Number(principalAmount) || original.principalAmount,
      depositDate: new Date(),
      maturityDate: new Date(newMaturityDate || original.maturityDate),
      interestRate: original.interestRate,
      compoundingFrequency: original.compoundingFrequency,
      autoRenewal: original.autoRenewal
    });

    const days =
      (newDeposit.maturityDate.getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24);
    newDeposit.currentValue = calculateCompoundInterest(
      newDeposit.principalAmount,
      newDeposit.interestRate,
      newDeposit.compoundingFrequency,
      Math.max(1, days)
    );

    await newDeposit.save();

    // Update original to Matured if not already
    if (original.status === "Active") {
      original.status = "Matured";
      await original.save();
    }

    res.status(201).json(newDeposit);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const withdrawTermDeposit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { withdrawalAmount } = req.body;

    const deposit = await TermDeposit.findById(id);
    if (!deposit) {
      return res.status(404).json({ error: "Term deposit not found" });
    }

    // Calculate early withdrawal penalty (default: 0.5% of amount per month remaining)
    const daysRemaining =
      (deposit.maturityDate.getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24);
    const monthsRemaining = daysRemaining / 30;
    const penaltyRate = monthsRemaining > 0 ? 0.5 : 0; // Only if before maturity
    const penalty = deposit.currentValue * (penaltyRate * monthsRemaining) / 100;

    const finalAmount = withdrawalAmount
      ? Math.min(Number(withdrawalAmount), deposit.currentValue - penalty)
      : deposit.currentValue - penalty;

    deposit.status = "Withdrawn";
    deposit.withdrawalDate = new Date();
    deposit.withdrawalAmount = finalAmount;

    await deposit.save();

    res.json({
      ...deposit.toObject(),
      penalty,
      finalAmount
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
