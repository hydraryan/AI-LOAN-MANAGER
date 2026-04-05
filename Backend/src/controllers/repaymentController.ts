import mongoose from "mongoose";
import { Request, Response } from "express";
import { Loan, RepaymentBulkRequest, Transaction } from "../models";

const toStartOfDay = (value: Date) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate());

const PAYMENT_METHODS = new Set([
  "cash",
  "bank transfer",
  "mobile money",
  "cheque",
  "system",
  "upi",
  "card"
]);

type RepaymentEntryInput = {
  loanId?: string;
  amount?: number;
  date?: string;
  method?: string;
};

type ValidatedRepaymentEntry = {
  loanId: string;
  requestedAmount: number;
  postedDate: Date;
  method: string;
};

type RepaymentResult = {
  inputIndex: number;
  loanId: string;
  requested: number;
  paid: number;
  overpayment: number;
  loanStatus: string;
};

type RepaymentSkipped = {
  inputIndex: number;
  loanId: string | null;
  reason: string;
};

type RepaymentWarning = {
  inputIndex: number;
  loanId: string;
  reason: string;
};

type RepaymentEntryOutcome =
  | { ok: true; result: RepaymentResult; warning?: RepaymentWarning }
  | { ok: false; skipped: RepaymentSkipped };

const parseIsoDate = (value: unknown): Date | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const parsed = new Date(`${trimmed}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeMethod = (value: unknown) => {
  const raw = String(value || "System").trim();
  if (!raw) return "System";
  const normalized = raw.toLowerCase();
  if (!PAYMENT_METHODS.has(normalized)) return null;
  return raw;
};

const toStoredMethod = (value: string) => {
  const normalized = String(value || "").trim().toLowerCase();
  const map: Record<string, string> = {
    cash: "Cash",
    "bank transfer": "Bank Transfer",
    "mobile money": "Mobile Money",
    cheque: "Cheque",
    system: "System",
    upi: "UPI",
    card: "Card"
  };

  return map[normalized] || "System";
};

const validateRepaymentEntry = (
  input: RepaymentEntryInput,
  inputIndex: number
): { ok: true; entry: ValidatedRepaymentEntry } | { ok: false; skipped: RepaymentSkipped } => {
  const loanId = String(input?.loanId || "").trim();
  if (!loanId || !mongoose.Types.ObjectId.isValid(loanId)) {
    return {
      ok: false,
      skipped: { inputIndex, loanId: loanId || null, reason: "Invalid loanId" }
    };
  }

  const requestedAmount = Number(input?.amount);
  if (!Number.isFinite(requestedAmount) || Number.isNaN(requestedAmount) || requestedAmount <= 0) {
    return {
      ok: false,
      skipped: { inputIndex, loanId, reason: "Invalid amount. Use a positive number." }
    };
  }

  const postedDate = parseIsoDate(input?.date);
  if (!postedDate) {
    return {
      ok: false,
      skipped: { inputIndex, loanId, reason: "Invalid date. Use YYYY-MM-DD." }
    };
  }

  const today = toStartOfDay(new Date());
  if (toStartOfDay(postedDate) > today) {
    return {
      ok: false,
      skipped: { inputIndex, loanId, reason: "Future posting date is not allowed." }
    };
  }

  const method = normalizeMethod(input?.method);
  if (!method) {
    return {
      ok: false,
      skipped: {
        inputIndex,
        loanId,
        reason: "Invalid method. Use Cash, Bank Transfer, Mobile Money, Cheque, UPI, Card, or System."
      }
    };
  }

  return {
    ok: true,
    entry: {
      loanId,
      requestedAmount,
      postedDate,
      method
    }
  };
};

const refreshScheduleStatuses = (
  schedule: Array<{ dueDate: Date; amount: number; paidAmount: number; status: string }>,
  now: Date
) => {
  const today = toStartOfDay(now);

  for (const installment of schedule) {
    const dueDate = toStartOfDay(new Date(installment.dueDate));
    const paidAmount = Number(installment.paidAmount || 0);
    const amount = Number(installment.amount || 0);
    const remaining = Math.max(0, amount - paidAmount);

    if (remaining <= 0) {
      installment.paidAmount = amount;
      installment.status = "paid";
      continue;
    }

    installment.status = dueDate < today ? "overdue" : "pending";
  }
};

const processRepaymentEntry = async (
  entry: ValidatedRepaymentEntry,
  inputIndex: number
): Promise<RepaymentEntryOutcome> => {
  const { requestedAmount, postedDate, method } = entry;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const session = await Loan.startSession();
    try {
      session.startTransaction();

      const loan = await Loan.findById(entry.loanId).session(session);

      if (!loan) {
        await session.abortTransaction();
        return {
          ok: false,
          skipped: { inputIndex, loanId: entry.loanId, reason: "Loan not found" }
        };
      }

      refreshScheduleStatuses(loan.schedule as any, postedDate);

      const outstandingBefore = loan.schedule.reduce((sum, installment) => {
        const due = Math.max(0, Number(installment.amount || 0) - Number(installment.paidAmount || 0));
        return sum + due;
      }, 0);

      if (outstandingBefore <= 0) {
        await session.abortTransaction();
        return {
          ok: false,
          skipped: { inputIndex, loanId: entry.loanId, reason: "Loan already fully paid" }
        };
      }

      const appliedAmount = Math.min(requestedAmount, outstandingBefore);
      const overpayment = Math.max(0, requestedAmount - outstandingBefore);
      let remaining = appliedAmount;

      for (const installment of loan.schedule) {
        const due = Math.max(0, Number(installment.amount || 0) - Number(installment.paidAmount || 0));
        if (due <= 0) {
          installment.status = "paid";
          continue;
        }

        if (remaining <= 0) {
          continue;
        }

        const pay = Math.min(due, remaining);
        installment.paidAmount = Number(installment.paidAmount || 0) + pay;
        remaining -= pay;
      }

      refreshScheduleStatuses(loan.schedule as any, postedDate);

      const fullyPaid = loan.schedule.every((installment) => installment.status === "paid");
      loan.status = fullyPaid ? "paid" : "active";
      await loan.save({ session });

      await Transaction.create(
        [
          {
            loanId: loan._id,
            amount: appliedAmount,
            requestedAmount,
            unappliedAmount: overpayment,
            method: toStoredMethod(method),
            status: "approved",
            postedDate
          }
        ],
        { session }
      );

      await session.commitTransaction();

      const resultPayload: {
        ok: true;
        result: RepaymentResult;
        warning?: RepaymentWarning;
      } = {
        ok: true,
        result: {
          inputIndex,
          loanId: String(loan._id),
          requested: requestedAmount,
          paid: appliedAmount,
          overpayment,
          loanStatus: loan.status
        }
      };

      if (overpayment > 0) {
        resultPayload.warning = {
          inputIndex,
          loanId: String(loan._id),
          reason: `Overpayment amount of ${overpayment} was recorded as unapplied.`
        };
      }

      return resultPayload;
    } catch (err: any) {
      await session.abortTransaction();

      if (
        err?.name === "VersionError" ||
        err?.code === 112 ||
        err?.errorLabels?.includes?.("TransientTransactionError")
      ) {
        continue;
      }

      return {
        ok: false,
        skipped: {
          inputIndex,
          loanId: entry.loanId,
          reason: err?.message || "Failed to process repayment entry"
        }
      };
    } finally {
      session.endSession();
    }
  }

  return {
    ok: false,
    skipped: {
      inputIndex,
      loanId: entry.loanId,
      reason: "Loan was modified concurrently. Retry this repayment entry."
    }
  };
};

const getIdempotencyKey = (req: Request) => {
  const headerKey = req.header("x-idempotency-key");
  if (headerKey && headerKey.trim()) return headerKey.trim();

  const bodyKey = typeof req.body?.idempotencyKey === "string" ? req.body.idempotencyKey.trim() : "";
  if (bodyKey) return bodyKey;

  return null;
};

export const getRepayments = async (_req: Request, res: Response) => {
  try {
    const txns = await Transaction.find({ loanId: { $exists: true, $ne: null } })
      .sort({ postedDate: -1, createdAt: -1 })
      .populate({
        path: "loanId",
        populate: {
          path: "borrowerId",
          populate: { path: "userId" }
        }
      });

    const formatted = txns
      .map((t: any) => {
        const loan = t.loanId;
        const status = String(t.status || "").toLowerCase();

        return {
          id: String(t._id),
          loanId: String(loan?._id || ""),
          borrowerName: loan?.borrowerId?.userId?.name || loan?.borrowerId?.name || "Unknown",
          amount: Number(t.amount || 0),
          date: t.postedDate || t.createdAt,
          method: t.method || "System",
          status: status === "approved" || status === "success" ? "Approved" : "Pending"
        };
      })
      .filter((row) => Boolean(row.loanId));

    res.json(formatted);
  } catch (err: any) {
    console.error("Failed to fetch repayments:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getRepaymentCredits = async (req: Request, res: Response) => {
  try {
    const borrowerId = String(req.params?.borrowerId || "").trim();

    if (!mongoose.Types.ObjectId.isValid(borrowerId)) {
      return res.status(400).json({ error: "Invalid borrowerId" });
    }

    const borrowerObjectId = new mongoose.Types.ObjectId(borrowerId);

    const rows = await Transaction.aggregate([
      {
        $match: {
          loanId: { $exists: true, $ne: null },
          unappliedAmount: { $gt: 0 }
        }
      },
      {
        $lookup: {
          from: "loans",
          localField: "loanId",
          foreignField: "_id",
          as: "loan"
        }
      },
      { $unwind: "$loan" },
      {
        $match: {
          "loan.borrowerId": borrowerObjectId
        }
      },
      {
        $group: {
          _id: "$loanId",
          credit: { $sum: "$unappliedAmount" }
        }
      }
    ]);

    const totalCredit = rows.reduce((sum, row) => sum + Number(row.credit || 0), 0);

    res.json({
      borrowerId,
      totalCredit,
      creditsByLoan: rows.map((row) => ({ loanId: String(row._id), credit: Number(row.credit || 0) }))
    });
  } catch (err: any) {
    console.error("Failed to fetch repayment credits:", err);
    res.status(500).json({ error: err.message });
  }
};

export const bulkRepayment = async (req: Request, res: Response) => {
  try {
    const { entries } = req.body;

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: "entries must be a non-empty array" });
    }

    const idempotencyKey = getIdempotencyKey(req);
    if (idempotencyKey) {
      const previous = await RepaymentBulkRequest.findOne({ idempotencyKey });
      if (previous) {
        return res.json({ ...((previous.responsePayload || {}) as object), idempotentReplay: true });
      }
    }

    const results: RepaymentResult[] = [];
    const skipped: RepaymentSkipped[] = [];
    const warnings: RepaymentWarning[] = [];

    for (let index = 0; index < entries.length; index += 1) {
      const validated = validateRepaymentEntry(entries[index], index);
      if (!validated.ok) {
        skipped.push(validated.skipped);
        continue;
      }

      const processed = await processRepaymentEntry(validated.entry, index);
      if (!processed.ok) {
        skipped.push(processed.skipped);
        continue;
      }

      results.push(processed.result);

      if (processed.warning) {
        warnings.push(processed.warning);
      }
    }

    if (results.length === 0) {
      return res.status(400).json({
        error: "No valid repayment entries were processed",
        skipped,
        warnings
      });
    }

    const responsePayload = {
      success: true,
      results,
      skipped,
      warnings,
      processedCount: results.length,
      skippedCount: skipped.length,
      warningCount: warnings.length
    };

    if (idempotencyKey) {
      try {
        await RepaymentBulkRequest.create({
          idempotencyKey,
          responsePayload
        });
      } catch (err: any) {
        if (err?.code === 11000) {
          const existing = await RepaymentBulkRequest.findOne({ idempotencyKey });
          if (existing) {
            return res.json({ ...((existing.responsePayload || {}) as object), idempotentReplay: true });
          }
        }
        throw err;
      }
    }

    res.json(responsePayload);
  } catch (err: any) {
    console.error("Failed to process bulk repayment:", err);
    res.status(500).json({ error: err.message });
  }
};