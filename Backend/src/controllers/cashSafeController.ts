import { Request, Response } from "express";
import CashSafe from "../models/CashSafe";
import CashSafeMovement from "../models/CashSafeMovement";

const getOrCreateSafe = async () => {
  const existing = await CashSafe.findOne().sort({ createdAt: 1 });
  if (existing) {
    return existing;
  }

  return CashSafe.create({
    name: "Main Cash Safe",
    openingBalance: 0,
    currentBalance: 0
  });
};

export const getCashSafe = async (_req: Request, res: Response) => {
  try {
    const cashSafe = await getOrCreateSafe();
    const movements = await CashSafeMovement.find({ cashSafeId: cashSafe._id })
      .sort({ postedAt: -1, createdAt: -1 })
      .limit(50);

    res.json({
      cashSafe,
      movements
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to load cash safe" });
  }
};

export const recordCashSafeMovement = async (req: Request, res: Response) => {
  try {
    const { type, amount, reference, notes, postedAt } = req.body || {};

    if (!["deposit", "withdrawal", "adjustment"].includes(String(type))) {
      return res.status(400).json({ error: "Valid movement type is required" });
    }

    const movementAmount = Number(amount || 0);
    if (Number.isNaN(movementAmount) || movementAmount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than zero" });
    }

    const cashSafe = await getOrCreateSafe();
    const signedAmount = type === "withdrawal" ? -movementAmount : movementAmount;
    cashSafe.currentBalance = Number(cashSafe.currentBalance || 0) + signedAmount;
    await cashSafe.save();

    const movement = await CashSafeMovement.create({
      cashSafeId: cashSafe._id,
      type,
      amount: movementAmount,
      reference,
      notes,
      postedAt: postedAt ? new Date(postedAt) : new Date(),
      postedBy: "system"
    });

    res.status(201).json({ cashSafe, movement });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to record movement" });
  }
};

export const reconcileCashSafe = async (req: Request, res: Response) => {
  try {
    const { currentBalance, notes } = req.body || {};
    const cashSafe = await getOrCreateSafe();
    const reconciledBalance = Number(currentBalance);

    if (Number.isNaN(reconciledBalance)) {
      return res.status(400).json({ error: "currentBalance is required" });
    }

    cashSafe.currentBalance = reconciledBalance;
    cashSafe.lastReconciledAt = new Date();
    if (notes) {
      cashSafe.notes = notes;
    }
    await cashSafe.save();

    res.json({ cashSafe });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to reconcile cash safe" });
  }
};

export const getCashSafeSummary = async (_req: Request, res: Response) => {
  try {
    const cashSafe = await getOrCreateSafe();
    const movements = await CashSafeMovement.find({ cashSafeId: cashSafe._id });
    const deposits = movements.filter((movement) => movement.type === "deposit").reduce((sum, movement) => sum + Number(movement.amount || 0), 0);
    const withdrawals = movements.filter((movement) => movement.type === "withdrawal").reduce((sum, movement) => sum + Number(movement.amount || 0), 0);
    const adjustments = movements.filter((movement) => movement.type === "adjustment").reduce((sum, movement) => sum + Number(movement.amount || 0), 0);

    res.json({
      openingBalance: cashSafe.openingBalance,
      currentBalance: cashSafe.currentBalance,
      deposits,
      withdrawals,
      adjustments,
      movementCount: movements.length,
      lastReconciledAt: cashSafe.lastReconciledAt
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to load cash safe summary" });
  }
};