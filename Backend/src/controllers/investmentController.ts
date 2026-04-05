import { Request, Response } from "express";
import mongoose from "mongoose";
import Investment from "../models/Investment";
import Investor from "../models/Investors";
import Loan from "../models/Loan";

const INVESTMENT_STATUSES = ["pending", "active", "completed", "defaulted"] as const;

const parsePageLimit = (query: any): { page: number; limit: number } => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return { page, limit };
};

const isValidObjectId = (value: unknown) =>
  typeof value === "string" && mongoose.Types.ObjectId.isValid(value);

const isValidStatus = (
  value: unknown
): value is (typeof INVESTMENT_STATUSES)[number] =>
  typeof value === "string" && INVESTMENT_STATUSES.includes(value as any);

const normalizeNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const normalizeDate = (value: unknown) => {
  const parsed = new Date(String(value || ""));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const mapInvestmentResponse = (investment: any) => {
  const investor =
    investment?.investorId && typeof investment.investorId === "object"
      ? investment.investorId
      : null;

  const loan =
    investment?.loanId && typeof investment.loanId === "object"
      ? investment.loanId
      : null;

  return {
    _id: investment._id,
    investorId: investor?._id?.toString?.() || String(investment.investorId || ""),
    loanId: loan?._id?.toString?.() || String(investment.loanId || ""),
    amount: Number(investment.amount || 0),
    interestRate: Number(investment.interestRate || 0),
    investmentDate: investment.investmentDate,
    expectedReturnDate: investment.expectedReturnDate,
    status: investment.status,
    totalReturned: Number(investment.totalReturned || 0),
    notes: investment.notes,
    createdAt: investment.createdAt,
    updatedAt: investment.updatedAt,
    investorDetails: investor
      ? {
          _id: investor._id,
          name: investor.name,
          email: investor.email,
          phone: investor.phone,
          address: investor.address,
        }
      : undefined,
    loanDetails: loan
      ? {
          _id: loan._id,
          loanNumber: loan.loanNumber,
          principal: loan.principal,
          interestRate: loan.interestRate,
          borrowerId: loan.borrowerId,
        }
      : undefined,
  };
};

export const getInvestments = async (req: Request, res: Response) => {
  try {
    const { investorId, loanId, status } = req.query;
    const { page, limit } = parsePageLimit(req.query);
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (investorId && typeof investorId === 'string') {
      if (!isValidObjectId(investorId)) {
        return res.status(400).json({ error: "Invalid investorId filter" });
      }
      filter.investorId = investorId;
    }
    if (loanId && typeof loanId === 'string') {
      if (!isValidObjectId(loanId)) {
        return res.status(400).json({ error: "Invalid loanId filter" });
      }
      filter.loanId = loanId;
    }
    if (status && typeof status === 'string') {
      if (!isValidStatus(status)) {
        return res.status(400).json({ error: "Invalid status filter" });
      }
      filter.status = status;
    }

    const investments = await Investment.find(filter)
      .populate("investorId", "name email")
      .populate("loanId", "loanNumber principal borrowerId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Investment.countDocuments(filter);

    res.status(200).json({
      data: investments.map(mapInvestmentResponse),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getInvestmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid investment ID" });
    }

    const investment = await Investment.findById(id)
      .populate("investorId", "name email phone address")
      .populate("loanId", "loanNumber principal borrowerId interestRate");

    if (!investment) {
      return res.status(404).json({ error: "Investment not found" });
    }

    res.status(200).json(mapInvestmentResponse(investment));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getInvestmentsByInvestorId = async (req: Request, res: Response) => {
  try {
    const { investorId } = req.params;
    const { page, limit } = parsePageLimit(req.query);
    const skip = (page - 1) * limit;

    if (typeof investorId !== 'string' || !mongoose.Types.ObjectId.isValid(investorId)) {
      return res.status(400).json({ error: "Invalid investor ID" });
    }

    const investor = await Investor.findById(investorId);
    if (!investor) {
      return res.status(404).json({ error: "Investor not found" });
    }

    const investorObjectId = new mongoose.Types.ObjectId(investorId);
    const investments = await Investment.find({ investorId: investorObjectId })
      .populate("investorId", "name email")
      .populate("loanId", "loanNumber principal interestRate")
      .sort({ investmentDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Investment.countDocuments({ investorId: investorObjectId });

    res.status(200).json({
      data: investments.map(mapInvestmentResponse),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getInvestmentsByLoanId = async (req: Request, res: Response) => {
  try {
    const { loanId } = req.params;
    const { page, limit } = parsePageLimit(req.query);
    const skip = (page - 1) * limit;

    if (typeof loanId !== 'string' || !mongoose.Types.ObjectId.isValid(loanId)) {
      return res.status(400).json({ error: "Invalid loan ID" });
    }

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ error: "Loan not found" });
    }

    const loanObjectId = new mongoose.Types.ObjectId(loanId);
    const investments = await Investment.find({ loanId: loanObjectId })
      .populate("loanId", "loanNumber principal interestRate borrowerId")
      .populate("investorId", "name email")
      .sort({ investmentDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Investment.countDocuments({ loanId: loanObjectId });

    res.status(200).json({
      data: investments.map(mapInvestmentResponse),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createInvestment = async (req: Request, res: Response) => {
  try {
    const { investorId, loanId, amount, interestRate, expectedReturnDate, notes } =
      req.body;

    if (!investorId || !loanId || amount === undefined || interestRate === undefined || !expectedReturnDate) {
      return res.status(400).json({
        error: "investorId, loanId, amount, interestRate, and expectedReturnDate are required"
      });
    }

    if (!isValidObjectId(investorId)) {
      return res.status(400).json({ error: "Invalid investorId" });
    }

    if (!isValidObjectId(loanId)) {
      return res.status(400).json({ error: "Invalid loanId" });
    }

    const normalizedAmount = normalizeNumber(amount);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      return res.status(400).json({ error: "amount must be greater than 0" });
    }

    const normalizedInterestRate = normalizeNumber(interestRate);
    if (
      !Number.isFinite(normalizedInterestRate) ||
      normalizedInterestRate < 0 ||
      normalizedInterestRate > 100
    ) {
      return res
        .status(400)
        .json({ error: "interestRate must be between 0 and 100" });
    }

    const normalizedExpectedReturnDate = normalizeDate(expectedReturnDate);
    if (!normalizedExpectedReturnDate) {
      return res.status(400).json({ error: "expectedReturnDate is invalid" });
    }

    const investor = await Investor.findById(investorId);
    if (!investor) {
      return res.status(404).json({ error: "Investor not found" });
    }

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ error: "Loan not found" });
    }

    if (normalizedAmount > Number(loan.principal || 0)) {
      return res.status(400).json({
        error: "Investment amount cannot exceed loan principal"
      });
    }

    const existingActiveInvestments = await Investment.aggregate([
      { $match: { loanId: loan._id, status: { $in: ["pending", "active"] } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const allocatedAmount = Number(existingActiveInvestments[0]?.total || 0);
    if (allocatedAmount + normalizedAmount > Number(loan.principal || 0)) {
      return res.status(409).json({
        error: "Total allocated investment amount exceeds loan principal"
      });
    }

    const investment = await Investment.create({
      investorId,
      loanId,
      amount: normalizedAmount,
      interestRate: normalizedInterestRate,
      expectedReturnDate: normalizedExpectedReturnDate,
      notes: notes?.trim()
    });

    await investment.populate("investorId", "name email");
    await investment.populate("loanId", "loanNumber principal");

    res.status(201).json(mapInvestmentResponse(investment));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateInvestment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, interestRate, expectedReturnDate, status, totalReturned, notes } =
      req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid investment ID" });
    }

    const investment = await Investment.findById(id);
    if (!investment) {
      return res.status(404).json({ error: "Investment not found" });
    }

    if (amount !== undefined) {
      const normalizedAmount = normalizeNumber(amount);
      if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
        return res.status(400).json({ error: "amount must be greater than 0" });
      }
      const loan = await Loan.findById(investment.loanId);
      if (loan && normalizedAmount > Number(loan.principal || 0)) {
        return res.status(400).json({
          error: "Investment amount cannot exceed loan principal"
        });
      }
      investment.amount = normalizedAmount;
    }

    if (interestRate !== undefined) {
      const normalizedInterestRate = normalizeNumber(interestRate);
      if (
        !Number.isFinite(normalizedInterestRate) ||
        normalizedInterestRate < 0 ||
        normalizedInterestRate > 100
      ) {
        return res
          .status(400)
          .json({ error: "interestRate must be between 0 and 100" });
      }
      investment.interestRate = normalizedInterestRate;
    }

    if (expectedReturnDate !== undefined) {
      const normalizedExpectedReturnDate = normalizeDate(expectedReturnDate);
      if (!normalizedExpectedReturnDate) {
        return res.status(400).json({ error: "expectedReturnDate is invalid" });
      }
      investment.expectedReturnDate = normalizedExpectedReturnDate as any;
    }

    if (status !== undefined) {
      if (!isValidStatus(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      investment.status = status;
    }

    if (totalReturned !== undefined) {
      const normalizedTotalReturned = normalizeNumber(totalReturned);
      if (!Number.isFinite(normalizedTotalReturned) || normalizedTotalReturned < 0) {
        return res
          .status(400)
          .json({ error: "totalReturned must be a non-negative number" });
      }
      investment.totalReturned = normalizedTotalReturned;
    }

    if (notes !== undefined) investment.notes = notes?.trim();

    await investment.save();
    await investment.populate("investorId", "name email");
    await investment.populate("loanId", "loanNumber principal");

    res.status(200).json(mapInvestmentResponse(investment));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteInvestment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid investment ID" });
    }

    const investment = await Investment.findById(id);
    if (!investment) {
      return res.status(404).json({ error: "Investment not found" });
    }

    if (investment.status !== "pending") {
      return res
        .status(409)
        .json({ error: "Only pending investments can be deleted" });
    }

    if (Number(investment.totalReturned || 0) > 0) {
      return res
        .status(409)
        .json({ error: "Cannot delete investment with returned amount" });
    }

    await investment.deleteOne();

    res.status(200).json({ message: "Investment deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
