import { Request, Response } from "express";
import { Loan } from "../models";
import { generateSchedule } from "../utils/loanCalculator";

export const createLoan = async (req: Request, res: Response) => {
  const { borrowerId, principal, interestRate, tenureMonths } = req.body;

  const { emi, schedule } = generateSchedule(
    principal,
    interestRate,
    tenureMonths
  );

  const loan = await Loan.create({
    borrowerId,
    principal,
    interestRate,
    tenureMonths,
    emi,
    schedule
  });

  res.json(loan);
};
export const getLoans = async (_req: Request, res: Response) => {
  const loans = await Loan.find().populate({
    path: "borrowerId",
    populate: { path: "userId" }
  });

  const formatted = loans.map((loan) => ({
    id: loan._id,
    borrower: (loan.borrowerId as any)?.userId?.name,
    principal: loan.principal,
    emi: loan.emi,
    status: loan.status,
    schedule: loan.schedule
  }));

  res.json(formatted);
};