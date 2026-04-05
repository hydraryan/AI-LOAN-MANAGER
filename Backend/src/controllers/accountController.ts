import { Request, Response } from "express";
import mongoose from "mongoose";
import Account from "../models/Account";

export const getAccounts = async (_req: Request, res: Response) => {
  try {
    const data = await Account.find().sort({ code: 1, name: 1 });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch accounts" });
  }
};

export const createAccount = async (req: Request, res: Response) => {
  try {
    const { code, name, type, balance } = req.body || {};

    if (!code || !name || !type) {
      return res.status(400).json({ error: "code, name and type are required" });
    }

    const normalizedCode = String(code).trim();
    const normalizedName = String(name).trim();
    const normalizedType = String(type).trim();
    const normalizedBalance = Number(balance || 0);

    const allowedTypes = ["Asset", "Liability", "Equity", "Revenue", "Expense"];
    if (!allowedTypes.includes(normalizedType)) {
      return res.status(400).json({ error: "Invalid account type" });
    }

    if (Number.isNaN(normalizedBalance)) {
      return res.status(400).json({ error: "Invalid balance" });
    }

    const duplicateCode = await Account.findOne({ code: normalizedCode });
    if (duplicateCode) {
      return res.status(400).json({ error: "Account code already exists" });
    }

    const account = await Account.create({
      code: normalizedCode,
      name: normalizedName,
      type: normalizedType,
      balance: normalizedBalance
    });

    res.status(201).json(account);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create account" });
  }
};

export const getAccountById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) {
      return res.status(400).json({ error: "Invalid account id" });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid account id" });
    }

    const account = await Account.findById(id);
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    res.json(account);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch account" });
  }
};

export const updateAccount = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) {
      return res.status(400).json({ error: "Invalid account id" });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid account id" });
    }

    const existing = await Account.findById(id);
    if (!existing) {
      return res.status(404).json({ error: "Account not found" });
    }

    const code = String(req.body?.code ?? existing.code).trim();
    const name = String(req.body?.name ?? existing.name).trim();
    const type = String(req.body?.type ?? existing.type).trim();
    const balance = Number(req.body?.balance ?? existing.balance);

    const allowedTypes = ["Asset", "Liability", "Equity", "Revenue", "Expense"];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ error: "Invalid account type" });
    }

    if (Number.isNaN(balance)) {
      return res.status(400).json({ error: "Invalid balance" });
    }

    const duplicateCode = await Account.findOne({ code, _id: { $ne: new mongoose.Types.ObjectId(id) } });
    if (duplicateCode) {
      return res.status(400).json({ error: "Account code already exists" });
    }

    existing.code = code;
    existing.name = name;
    existing.type = type;
    existing.balance = balance;
    await existing.save();

    res.json(existing);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update account" });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) {
      return res.status(400).json({ error: "Invalid account id" });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid account id" });
    }

    const deleted = await Account.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "Account not found" });
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete account" });
  }
};