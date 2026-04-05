import { Request, Response } from "express";
import mongoose from "mongoose";
import InvestorAccount from "../models/InvestorAccount";
import Investor from "../models/Investors";

const ACCOUNT_TYPES = ["savings", "checking", "investment", "other"] as const;
const ACCOUNT_STATUSES = ["active", "inactive", "suspended"] as const;

const parsePageLimit = (query: any): { page: number; limit: number } => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return { page, limit };
};

const isValidObjectId = (value: unknown) =>
  typeof value === "string" && mongoose.Types.ObjectId.isValid(value);

const isValidAccountType = (
  value: unknown
): value is (typeof ACCOUNT_TYPES)[number] =>
  typeof value === "string" && ACCOUNT_TYPES.includes(value as any);

const isValidAccountStatus = (
  value: unknown
): value is (typeof ACCOUNT_STATUSES)[number] =>
  typeof value === "string" && ACCOUNT_STATUSES.includes(value as any);

const normalizeBalance = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const normalizeCurrency = (value: unknown) =>
  String(value || "USD")
    .trim()
    .toUpperCase();

const mapInvestorAccountResponse = (account: any) => {
  const investor =
    account?.investorId && typeof account.investorId === "object"
      ? account.investorId
      : null;

  return {
    _id: account._id,
    investorId: investor?._id?.toString?.() || String(account.investorId || ""),
    accountNumber: account.accountNumber,
    accountType: account.accountType,
    bank: account.bank,
    balance: Number(account.balance || 0),
    currency: account.currency,
    status: account.status,
    notes: account.notes,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
    investorDetails: investor
      ? {
          _id: investor._id,
          name: investor.name,
          email: investor.email,
          phone: investor.phone,
          address: investor.address,
        }
      : undefined,
  };
};

export const getInvestorAccounts = async (req: Request, res: Response) => {
  try {
    const { investorId, status } = req.query;
    const { page, limit } = parsePageLimit(req.query);
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (investorId && typeof investorId === 'string') {
      if (!isValidObjectId(investorId)) {
        return res.status(400).json({ error: "Invalid investorId filter" });
      }
      filter.investorId = investorId;
    }
    if (status && typeof status === 'string') {
      if (!isValidAccountStatus(status)) {
        return res.status(400).json({ error: "Invalid status filter" });
      }
      filter.status = status;
    }

    const accounts = await InvestorAccount.find(filter)
      .populate("investorId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await InvestorAccount.countDocuments(filter);

    res.status(200).json({
      data: accounts.map(mapInvestorAccountResponse),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getInvestorAccountById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid account ID" });
    }

    const account = await InvestorAccount.findById(id).populate(
      "investorId",
      "name email phone address"
    );

    if (!account) {
      return res.status(404).json({ error: "Investor account not found" });
    }

    res.status(200).json(mapInvestorAccountResponse(account));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getInvestorAccountsByInvestorId = async (req: Request, res: Response) => {
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
    const accounts = await InvestorAccount.find({ investorId: investorObjectId })
      .populate("investorId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await InvestorAccount.countDocuments({ investorId: investorObjectId });

    res.status(200).json({
      data: accounts.map(mapInvestorAccountResponse),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createInvestorAccount = async (req: Request, res: Response) => {
  try {
    const { investorId, accountNumber, accountType, bank, balance, currency, notes } =
      req.body;

    if (!investorId || !accountNumber || !accountType || !bank) {
      return res.status(400).json({
        error: "investorId, accountNumber, accountType, and bank are required"
      });
    }

    if (!isValidObjectId(investorId)) {
      return res.status(400).json({ error: "Invalid investorId" });
    }

    if (!isValidAccountType(accountType)) {
      return res.status(400).json({ error: "Invalid accountType" });
    }

    const normalizedBalance = balance === undefined ? 0 : normalizeBalance(balance);
    if (!Number.isFinite(normalizedBalance) || normalizedBalance < 0) {
      return res.status(400).json({ error: "balance must be a non-negative number" });
    }

    const normalizedCurrency = normalizeCurrency(currency);
    if (!/^[A-Z]{3,5}$/.test(normalizedCurrency)) {
      return res.status(400).json({ error: "currency must be 3-5 uppercase letters" });
    }

    const investor = await Investor.findById(investorId);
    if (!investor) {
      return res.status(404).json({ error: "Investor not found" });
    }

    const normalizedAccountNumber = String(accountNumber).trim();
    const existingAccount = await InvestorAccount.findOne({ accountNumber: normalizedAccountNumber });
    if (existingAccount) {
      return res.status(409).json({ error: "Account with this number already exists" });
    }

    const account = await InvestorAccount.create({
      investorId,
      accountNumber: normalizedAccountNumber,
      accountType,
      bank: bank.trim(),
      balance: normalizedBalance,
      currency: normalizedCurrency,
      notes: notes?.trim()
    });

    await account.populate("investorId", "name email");

    res.status(201).json(mapInvestorAccountResponse(account));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateInvestorAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { accountNumber, accountType, bank, balance, currency, status, notes } =
      req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid account ID" });
    }

    const account = await InvestorAccount.findById(id);
    if (!account) {
      return res.status(404).json({ error: "Investor account not found" });
    }

    const normalizedAccountNumber =
      accountNumber !== undefined ? String(accountNumber).trim() : undefined;

    if (normalizedAccountNumber && normalizedAccountNumber !== account.accountNumber) {
      const existing = await InvestorAccount.findOne({ accountNumber: normalizedAccountNumber });
      if (existing) {
        return res.status(409).json({ error: "Account with this number already exists" });
      }
    }

    if (accountType !== undefined && !isValidAccountType(accountType)) {
      return res.status(400).json({ error: "Invalid accountType" });
    }

    if (status !== undefined && !isValidAccountStatus(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    if (balance !== undefined) {
      const normalizedBalance = normalizeBalance(balance);
      if (!Number.isFinite(normalizedBalance) || normalizedBalance < 0) {
        return res.status(400).json({ error: "balance must be a non-negative number" });
      }
      account.balance = normalizedBalance;
    }

    if (currency !== undefined) {
      const normalizedCurrency = normalizeCurrency(currency);
      if (!/^[A-Z]{3,5}$/.test(normalizedCurrency)) {
        return res.status(400).json({ error: "currency must be 3-5 uppercase letters" });
      }
      account.currency = normalizedCurrency;
    }

    if (normalizedAccountNumber) account.accountNumber = normalizedAccountNumber;
    if (accountType) account.accountType = accountType;
    if (bank) account.bank = bank.trim();
    if (status) account.status = status;
    if (notes !== undefined) account.notes = notes?.trim();

    await account.save();
    await account.populate("investorId", "name email");

    res.status(200).json(mapInvestorAccountResponse(account));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteInvestorAccount = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid account ID" });
    }

    const existing = await InvestorAccount.findById(id);
    if (!existing) {
      return res.status(404).json({ error: "Investor account not found" });
    }

    if (Number(existing.balance || 0) > 0) {
      return res.status(409).json({
        error: "Cannot delete an account with a positive balance. Set balance to 0 first."
      });
    }

    await existing.deleteOne();

    res.status(200).json({ message: "Investor account deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
