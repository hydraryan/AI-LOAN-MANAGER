import { Request, Response } from "express";
import { Borrower, Loan } from "../models";
import { generateSchedule } from "../utils/loanCalculator";

const ALLOWED_LOAN_STATUSES = ["pending", "approved", "active", "paid", "closed", "defaulted"] as const;
const LOAN_STATUS_TRANSITIONS: Record<(typeof ALLOWED_LOAN_STATUSES)[number], Array<(typeof ALLOWED_LOAN_STATUSES)[number]>> = {
  pending: ["approved", "closed", "defaulted"],
  approved: ["active", "closed", "defaulted"],
  active: ["paid", "closed", "defaulted"],
  paid: ["closed"],
  closed: [],
  defaulted: ["active", "closed"]
};

const canTransitionLoanStatus = (
  currentStatus: (typeof ALLOWED_LOAN_STATUSES)[number],
  nextStatus: (typeof ALLOWED_LOAN_STATUSES)[number]
) => {
  if (currentStatus === nextStatus) {
    return true;
  }

  return LOAN_STATUS_TRANSITIONS[currentStatus].includes(nextStatus);
};

export const createLoan = async (req: Request, res: Response) => {
  try {
    const { borrowerId, principal, interestRate, tenureMonths, status } = req.body;

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

    const borrowerExists = await Borrower.exists({ _id: borrowerId });
    if (!borrowerExists) {
      return res.status(400).json({ error: "Borrower not found" });
    }

    if (status !== undefined && !ALLOWED_LOAN_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Invalid loan status. Allowed values: ${ALLOWED_LOAN_STATUSES.join(", ")}`
      });
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
      status: status || "approved",
      emi,
      schedule
    });

    res.status(201).json(loan);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
export const getLoans = async (req: Request, res: Response) => {
  try {
    const limitRaw = Number(req.query.limit);
    const skipRaw = Number(req.query.skip);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(Math.floor(limitRaw), 1000) : null;
    const skip = Number.isFinite(skipRaw) && skipRaw >= 0 ? Math.floor(skipRaw) : 0;

    let query = Loan.find().populate({
      path: "borrowerId",
      populate: { path: "userId" }
    });

    if (skip > 0) {
      query = query.skip(skip);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const loans = await query;
    res.json(loans);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Failed to fetch loans" });
  }
};

export const getLoanById = async (req: Request, res: Response) => {
  try {
    const loan = await Loan.findById(req.params.id).populate({
      path: "borrowerId",
      populate: { path: "userId" }
    });

    if (!loan) {
      return res.status(404).json({ error: "Loan not found" });
    }

    return res.json(loan);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateLoan = async (req: Request, res: Response) => {
  try {
    const loanId = req.params.id;
    const { borrowerId, principal, interestRate, tenureMonths, status } = req.body;

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ error: "Loan not found" });
    }

    const updates: Record<string, any> = {};
    const hasPayments = (loan.schedule || []).some((installment) => Number(installment.paidAmount || 0) > 0);
    const changingCoreTerms = principal !== undefined || interestRate !== undefined || tenureMonths !== undefined;

    if (borrowerId !== undefined) {
      const borrowerExists = await Borrower.exists({ _id: borrowerId });
      if (!borrowerExists) {
        return res.status(400).json({ error: "Borrower not found" });
      }
      updates.borrowerId = borrowerId;
    }

    if (status !== undefined) {
      if (!ALLOWED_LOAN_STATUSES.includes(status)) {
        return res.status(400).json({
          error: `Invalid loan status. Allowed values: ${ALLOWED_LOAN_STATUSES.join(", ")}`
        });
      }

      const currentStatus = loan.status as (typeof ALLOWED_LOAN_STATUSES)[number];
      const nextStatus = status as (typeof ALLOWED_LOAN_STATUSES)[number];

      if (!canTransitionLoanStatus(currentStatus, nextStatus)) {
        return res.status(409).json({
          error: `Invalid status transition from '${currentStatus}' to '${nextStatus}'`
        });
      }

      updates.status = status;
    }

    if (changingCoreTerms) {
      if (hasPayments) {
        return res.status(409).json({
          error: "Loan terms cannot be changed after repayments have been recorded. Create a new loan for revised terms."
        });
      }

      const parsedPrincipal = principal !== undefined ? Number(principal) : loan.principal;
      const parsedInterestRate = interestRate !== undefined ? Number(interestRate) : loan.interestRate;
      const parsedTenureMonths = tenureMonths !== undefined ? Number(tenureMonths) : loan.tenureMonths;

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

      const recalculated = generateSchedule(parsedPrincipal, parsedInterestRate, parsedTenureMonths);
      updates.principal = parsedPrincipal;
      updates.interestRate = parsedInterestRate;
      updates.tenureMonths = parsedTenureMonths;
      updates.emi = recalculated.emi;
      updates.schedule = recalculated.schedule;
    }

    const updatedLoan = await Loan.findByIdAndUpdate(loanId, updates, {
      new: true,
      runValidators: true
    }).populate({
      path: "borrowerId",
      populate: { path: "userId" }
    });

    return res.json(updatedLoan);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateLoanStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body as { status?: string };

    if (!status || !ALLOWED_LOAN_STATUSES.includes(status as typeof ALLOWED_LOAN_STATUSES[number])) {
      return res.status(400).json({
        error: `Invalid loan status. Allowed values: ${ALLOWED_LOAN_STATUSES.join(", ")}`
      });
    }

    const loan = await Loan.findById(req.params.id).populate({
      path: "borrowerId",
      populate: { path: "userId" }
    });

    if (!loan) {
      return res.status(404).json({ error: "Loan not found" });
    }

    const currentStatus = loan.status as (typeof ALLOWED_LOAN_STATUSES)[number];
    const nextStatus = status as (typeof ALLOWED_LOAN_STATUSES)[number];

    if (!canTransitionLoanStatus(currentStatus, nextStatus)) {
      return res.status(409).json({
        error: `Invalid status transition from '${currentStatus}' to '${nextStatus}'`
      });
    }

    loan.status = nextStatus;
    await loan.save();

    return res.json(loan);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getLoanGuarantors = async (req: Request, res: Response) => {
  try {
    const loan = await Loan.findById(req.params.id).select("_id guarantors");
    if (!loan) {
      return res.status(404).json({ error: "Loan not found" });
    }

    return res.json({ loanId: loan._id, guarantors: loan.guarantors || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateLoanGuarantors = async (req: Request, res: Response) => {
  try {
    const { guarantors } = req.body as {
      guarantors?: Array<{ name?: string; phone?: string; relation?: string }>;
    };

    if (!Array.isArray(guarantors)) {
      return res.status(400).json({ error: "guarantors must be an array" });
    }

    const normalizedGuarantors = guarantors
      .map((item) => ({
        name: String(item?.name || "").trim(),
        phone: String(item?.phone || "").trim(),
        relation: String(item?.relation || "").trim(),
        addedAt: new Date()
      }))
      .filter((item) => item.name.length > 0);

    const loan = await Loan.findByIdAndUpdate(
      req.params.id,
      { guarantors: normalizedGuarantors },
      { new: true, runValidators: true }
    ).select("_id guarantors");

    if (!loan) {
      return res.status(404).json({ error: "Loan not found" });
    }

    return res.json({ loanId: loan._id, guarantors: loan.guarantors || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getLoanComments = async (req: Request, res: Response) => {
  try {
    const loan = await Loan.findById(req.params.id).select("_id comments");
    if (!loan) {
      return res.status(404).json({ error: "Loan not found" });
    }

    return res.json({ loanId: loan._id, comments: loan.comments || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const addLoanComment = async (req: Request, res: Response) => {
  try {
    const { text } = req.body as { text?: string };
    const normalizedText = String(text || "").trim();

    if (!normalizedText) {
      return res.status(400).json({ error: "Comment text is required" });
    }

    const loan = await Loan.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          comments: {
            text: normalizedText,
            createdAt: new Date()
          }
        }
      },
      { new: true, runValidators: true }
    ).select("_id comments");

    if (!loan) {
      return res.status(404).json({ error: "Loan not found" });
    }

    return res.status(201).json({ loanId: loan._id, comments: loan.comments || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};