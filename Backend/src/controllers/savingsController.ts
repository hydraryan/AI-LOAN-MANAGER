import { Request, Response } from "express";
import Savings from "../models/Savings";

export const createSavings = async (req: Request, res: Response) => {
  try {
    const { borrowerId, accountNumber, balance, interestRate } = req.body;

    if (!borrowerId || !accountNumber) {
      return res.status(400).json({ error: "borrowerId and accountNumber are required" });
    }

    const parsedBalance = Number(balance ?? 0);
    const parsedInterestRate = Number(interestRate ?? 5);

    if (
      Number.isNaN(parsedBalance) ||
      Number.isNaN(parsedInterestRate) ||
      parsedBalance < 0 ||
      parsedInterestRate < 0
    ) {
      return res.status(400).json({ error: "Invalid savings input values" });
    }

    const savings = await Savings.create({
      borrowerId,
      accountNumber,
      balance: parsedBalance,
      interestRate: parsedInterestRate
    });

    res.status(201).json(savings);
  } catch (err: any) {
    if (err?.code === 11000) {
      return res.status(400).json({ error: "Account number already exists" });
    }
    res.status(500).json({ error: err.message });
  }
};

export const getSavings = async (_req: Request, res: Response) => {
  try {
    const data = await Savings.find().populate({
      path: "borrowerId",
      populate: { path: "userId" }
    });

    const formatted = data.map((s: any) => ({
      id: s._id,
      accountNumber: s.accountNumber,
      borrowerName: s.borrowerId?.userId?.name,
      productName: s.productName,
      balance: s.balance,
      interestRate: s.interestRate,
      status: s.status
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};