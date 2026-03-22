import { Request, Response } from "express";
import Savings from "../models/Savings";

export const createSavings = async (req: Request, res: Response) => {
  try {
    const { borrowerId, accountNumber, balance, interestRate } = req.body;

    const savings = await Savings.create({
      borrowerId,
      accountNumber,
      balance,
      interestRate
    });

    res.json(savings);
  } catch (err: any) {
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