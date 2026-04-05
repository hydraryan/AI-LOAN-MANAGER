import { Request, Response } from "express";
import { Savings, Transaction } from "../models";

const VALID_STATUSES = ["pending", "approved", "rejected"] as const;
const VALID_METHODS = ["Cash", "Bank Transfer", "System", "Mobile Money", "Cheque"] as const;
const MAX_BULK_SIZE = 1000;
const SAVINGS_TRANSACTION_FILTER = { savingsAccountId: { $exists: true, $ne: null } };

const parsePage = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const parseLimit = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(Math.floor(parsed), 100) : fallback;
};

const normalizeStatus = (value: unknown, fallback: (typeof VALID_STATUSES)[number] = "pending") => {
  const normalized = String(value || "").trim().toLowerCase();
  return VALID_STATUSES.includes(normalized as (typeof VALID_STATUSES)[number])
    ? (normalized as (typeof VALID_STATUSES)[number])
    : fallback;
};

const normalizeMethod = (value: unknown, fallback: (typeof VALID_METHODS)[number] = "System") => {
  const input = String(value || "").trim();
  const matched = VALID_METHODS.find((method) => method.toLowerCase() === input.toLowerCase());
  return matched || fallback;
};

const parseNonNegativeNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseDateOrNull = (value: unknown) => {
  if (!value) {
    return null;
  }
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

const buildTransactionView = (transaction: any) => ({
  id: String(transaction._id),
  savingsAccountId: String(transaction.savingsAccountId?._id || transaction.savingsAccountId || ""),
  borrowerId: String(transaction.savingsAccountId?.borrowerId?._id || transaction.savingsAccountId?.borrowerId || ""),
  borrowerName:
    transaction.savingsAccountId?.borrowerId?.name ||
    transaction.savingsAccountId?.borrowerId?.userId?.name ||
    transaction.borrowerName ||
    "Unknown",
  accountNumber: transaction.savingsAccountId?.accountNumber || "N/A",
  amount: Number(transaction.amount || 0),
  requestedAmount: Number(transaction.requestedAmount || 0),
  unappliedAmount: Number(transaction.unappliedAmount || 0),
  method: transaction.method || "System",
  status: transaction.status || "pending",
  postedDate: transaction.postedDate || transaction.createdAt,
  createdAt: transaction.createdAt,
  updatedAt: transaction.updatedAt
});

const applySearch = (query: any) => {
  const search = String(query.search || "").trim();
  if (!search) {
    return {};
  }

  const escapedSearch = escapeRegex(search);

  return {
    $or: [
      { status: { $regex: escapedSearch, $options: "i" } },
      { method: { $regex: escapedSearch, $options: "i" } },
      { "savingsAccountId._id": { $regex: escapedSearch, $options: "i" } },
      { "savingsAccountId.accountNumber": { $regex: escapedSearch, $options: "i" } },
      { "savingsAccountId.borrowerId.name": { $regex: escapedSearch, $options: "i" } },
      { "savingsAccountId.borrowerId.userId.name": { $regex: escapedSearch, $options: "i" } }
    ]
  };
};

export const getSavingsTransactions = async (req: Request, res: Response) => {
  try {
    const page = parsePage(req.query.page, 1);
    const limit = parseLimit(req.query.limit, 20);
    const skip = (page - 1) * limit;

    const filter: any = { ...SAVINGS_TRANSACTION_FILTER };
    if (req.query.status) {
      filter.status = normalizeStatus(req.query.status);
    }
    if (req.query.method) {
      filter.method = normalizeMethod(req.query.method);
    }
    Object.assign(filter, applySearch(req.query));

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "savingsAccountId",
          populate: {
            path: "borrowerId",
            populate: { path: "userId", select: "name" }
          }
        }),
      Transaction.countDocuments(filter)
    ]);

    const data = transactions.map(buildTransactionView);

    res.json({
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch savings transactions" });
  }
};

export const createSavingsTransaction = async (req: Request, res: Response) => {
  try {
    const { savingsAccountId, amount, requestedAmount, unappliedAmount, method, status, postedDate } = req.body || {};

    if (!savingsAccountId) {
      return res.status(400).json({ error: "savingsAccountId is required" });
    }

    const savingsAccount = await Savings.findById(savingsAccountId);
    if (!savingsAccount) {
      return res.status(400).json({ error: "Savings account not found" });
    }

    const normalizedAmount = parseNonNegativeNumber(amount, -1);
    if (normalizedAmount <= 0) {
      return res.status(400).json({ error: "amount must be greater than 0" });
    }

    const normalizedRequestedAmount = parseNonNegativeNumber(requestedAmount, normalizedAmount);
    const normalizedUnappliedAmount = parseNonNegativeNumber(unappliedAmount, 0);

    if (normalizedRequestedAmount < normalizedAmount) {
      return res.status(400).json({ error: "requestedAmount cannot be less than amount" });
    }

    if (normalizedUnappliedAmount > normalizedAmount) {
      return res.status(400).json({ error: "unappliedAmount cannot exceed amount" });
    }

    const parsedPostedDate = postedDate ? parseDateOrNull(postedDate) : null;
    if (postedDate && !parsedPostedDate) {
      return res.status(400).json({ error: "postedDate is invalid" });
    }

    const transactionPayload: any = {
      savingsAccountId,
      amount: normalizedAmount,
      requestedAmount: normalizedRequestedAmount,
      unappliedAmount: normalizedUnappliedAmount,
      method: normalizeMethod(method),
      status: normalizeStatus(status)
    };

    if (parsedPostedDate) {
      transactionPayload.postedDate = parsedPostedDate;
    }

    const transaction = await Transaction.create(transactionPayload);

    const populated = await Transaction.findById(transaction._id).populate({
      path: "savingsAccountId",
      populate: {
        path: "borrowerId",
        populate: { path: "userId", select: "name" }
      }
    });

    return res.status(201).json(buildTransactionView(populated));
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to create savings transaction" });
  }
};

export const bulkCreateSavingsTransactions = async (req: Request, res: Response) => {
  try {
    const entries = Array.isArray(req.body?.entries) ? req.body.entries : [];

    const idempotencyKey = String(req.header("x-idempotency-key") || "").trim();
    if (!idempotencyKey) {
      return res.status(400).json({ error: "x-idempotency-key header is required" });
    }

    if (entries.length === 0) {
      return res.status(400).json({ error: "At least one entry is required" });
    }

    if (entries.length > MAX_BULK_SIZE) {
      return res.status(400).json({ error: `Maximum ${MAX_BULK_SIZE} entries allowed per request` });
    }

    const results: any[] = [];
    const skipped: any[] = [];

    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index];
      if (!entry?.savingsAccountId) {
        skipped.push({ inputIndex: index, savingsAccountId: entry?.savingsAccountId || null, reason: "Missing savingsAccountId" });
        continue;
      }

      const normalizedAmount = parseNonNegativeNumber(entry.amount, -1);
      if (normalizedAmount <= 0) {
        skipped.push({ inputIndex: index, savingsAccountId: entry?.savingsAccountId || null, reason: "Missing savingsAccountId or amount" });
        continue;
      }

      const normalizedRequestedAmount = parseNonNegativeNumber(entry.requestedAmount, normalizedAmount);
      const normalizedUnappliedAmount = parseNonNegativeNumber(entry.unappliedAmount, 0);

      if (normalizedRequestedAmount < normalizedAmount) {
        skipped.push({ inputIndex: index, savingsAccountId: entry.savingsAccountId, reason: "requestedAmount cannot be less than amount" });
        continue;
      }

      if (normalizedUnappliedAmount > normalizedAmount) {
        skipped.push({ inputIndex: index, savingsAccountId: entry.savingsAccountId, reason: "unappliedAmount cannot exceed amount" });
        continue;
      }

      const parsedEntryDate = entry.date ? parseDateOrNull(entry.date) : new Date();
      if (!parsedEntryDate) {
        skipped.push({ inputIndex: index, savingsAccountId: entry.savingsAccountId, reason: "Invalid date" });
        continue;
      }

      const savingsAccount = await Savings.findById(entry.savingsAccountId).populate({
        path: "borrowerId",
        populate: { path: "userId", select: "name" }
      });

      if (!savingsAccount) {
        skipped.push({ inputIndex: index, savingsAccountId: entry.savingsAccountId, reason: "Savings account not found" });
        continue;
      }

      const transaction = await Transaction.create({
        savingsAccountId: savingsAccount._id,
        amount: normalizedAmount,
        requestedAmount: normalizedRequestedAmount,
        unappliedAmount: normalizedUnappliedAmount,
        method: normalizeMethod(entry.method, "Cash"),
        status: normalizeStatus(entry.status),
        postedDate: parsedEntryDate
      });

      results.push(buildTransactionView({
        ...transaction.toObject(),
        savingsAccountId: savingsAccount
      }));
    }

    return res.status(201).json({
      success: true,
      results,
      skipped,
      processedCount: results.length,
      skippedCount: skipped.length,
      warningCount: 0
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to process savings transactions" });
  }
};

export const approveSavingsTransaction = async (req: Request, res: Response) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .where("savingsAccountId")
      .ne(null)
      .populate({
        path: "savingsAccountId",
        populate: {
          path: "borrowerId",
          populate: { path: "userId", select: "name" }
        }
      });

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const currentStatus = normalizeStatus(transaction.status);
    if (currentStatus !== "pending") {
      return res.status(400).json({ error: "Only pending transactions can be approved" });
    }

    transaction.status = "approved";
    transaction.postedDate = transaction.postedDate || new Date();
    await transaction.save();

    return res.json(buildTransactionView(transaction));
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to approve savings transaction" });
  }
};

export const rejectSavingsTransaction = async (req: Request, res: Response) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .where("savingsAccountId")
      .ne(null)
      .populate({
        path: "savingsAccountId",
        populate: {
          path: "borrowerId",
          populate: { path: "userId", select: "name" }
        }
      });

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const currentStatus = normalizeStatus(transaction.status);
    if (currentStatus !== "pending") {
      return res.status(400).json({ error: "Only pending transactions can be rejected" });
    }

    transaction.status = "rejected";
    await transaction.save();

    return res.json(buildTransactionView(transaction));
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to reject savings transaction" });
  }
};

export const getSavingsTransactionReport = async (_req: Request, res: Response) => {
  try {
    const page = parsePage(_req.query.page, 1);
    const limit = parseLimit(_req.query.limit, 20);
    const skip = (page - 1) * limit;

    const [transactions, pending, approved] = await Promise.all([
      Transaction.find({ ...SAVINGS_TRANSACTION_FILTER })
        .sort({ createdAt: -1 })
        .populate({
        path: "savingsAccountId",
        populate: {
          path: "borrowerId",
          populate: { path: "userId", select: "name" }
        }
      }),
      Transaction.countDocuments({ ...SAVINGS_TRANSACTION_FILTER, status: "pending" }),
      Transaction.countDocuments({ ...SAVINGS_TRANSACTION_FILTER, status: "approved" })
    ]);

    const totalTransactions = transactions.length;
    const pagedTransactions = transactions.slice(skip, skip + limit);

    const totalAmount = transactions.reduce((sum, txn) => sum + Number(txn.amount || 0), 0);
    const totalRequested = transactions.reduce((sum, txn) => sum + Number(txn.requestedAmount || 0), 0);
    const totalUnapplied = transactions.reduce((sum, txn) => sum + Number(txn.unappliedAmount || 0), 0);

    const methodMap = new Map<string, number>();
    transactions.forEach((txn) => {
      const method = txn.method || "System";
      methodMap.set(method, (methodMap.get(method) || 0) + 1);
    });

    res.json({
      totalTransactions,
      totalAmount,
      totalRequested,
      totalUnapplied,
      pending,
      approved,
      byMethod: Array.from(methodMap.entries()).map(([name, count]) => ({ name, count })),
      recentTransactions: pagedTransactions.map(buildTransactionView),
      pagination: {
        page,
        limit,
        total: totalTransactions,
        pages: Math.max(1, Math.ceil(totalTransactions / limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to load savings transaction report" });
  }
};
