import { Request, Response } from "express";
import { Loan } from "../models";
import { generateSchedule } from "../utils/loanCalculator";

export const createLoan = async (req: Request, res: Response) => {
  try {
    const { borrowerId, principal, interestRate, tenureMonths } = req.body;

    if (!borrowerId) {
      return res.status(400).json({ error: "borrowerId is required" });
    }

    const parsedPrincipal = Number(principal);
    const parsedInterestRate = Number(interestRate);
    const parsedTenureMonths = Number(tenureMonths);

    if (
      Number.isNaN(parsedPrincipal) ||
      Number.isNaN(parsedInterestRate) ||
      Number.isNaN(parsedTenureMonths) ||
      parsedPrincipal <= 0 ||
      parsedInterestRate < 0 ||
      parsedTenureMonths <= 0
    ) {
      return res.status(400).json({ error: "Invalid loan input values" });
    }

    const { emi, schedule } = generateSchedule(
      parsedPrincipal,
      parsedInterestRate,
      parsedTenureMonths
    );

    const loan = await Loan.create({
      borrowerId,
      principal: parsedPrincipal,
      interestRate: parsedInterestRate,
      tenureMonths: parsedTenureMonths,
      emi,
      schedule
    });

    res.status(201).json(loan);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
export const getLoans = async (_req: Request, res: Response) => {
  const loans = await Loan.find().populate({
    path: "borrowerId",
    populate: { path: "userId" }
  });

  res.json(loans);
};