import { Request, Response } from "express";
import mongoose from "mongoose";
import Collateral from "../models/Collateral";
import { Borrower, Loan } from "../models";

const ALLOWED_COLLATERAL_STATUS = new Set(["Deposited", "Returned", "Sold"]);

const validateCollateralPayload = async (
  payload: {
    borrowerId?: string;
    loanId?: string;
    type?: string;
    productName?: string;
    value?: number;
    serialNumber?: string;
    status?: string;
  },
  currentCollateralId?: string
) => {
  const borrowerId = String(payload.borrowerId || "").trim();
  const loanId = String(payload.loanId || "").trim();
  const type = String(payload.type || "").trim();
  const productName = String(payload.productName || "").trim();
  const serialNumber = String(payload.serialNumber || "").trim();
  const value = Number(payload.value);
  const status = String(payload.status || "Deposited").trim();

  if (!borrowerId || !type || !productName || !serialNumber || !Number.isFinite(value)) {
    return { ok: false as const, error: "borrowerId, type, productName, serialNumber and numeric value are required" };
  }

  if (!mongoose.Types.ObjectId.isValid(borrowerId)) {
    return { ok: false as const, error: "Invalid borrowerId" };
  }

  if (value <= 0) {
    return { ok: false as const, error: "value must be greater than 0" };
  }

  if (!ALLOWED_COLLATERAL_STATUS.has(status)) {
    return { ok: false as const, error: "Invalid status. Allowed: Deposited, Returned, Sold" };
  }

  const borrower = await Borrower.findById(borrowerId).lean();
  if (!borrower) {
    return { ok: false as const, error: "Borrower not found" };
  }

  if (loanId) {
    if (!mongoose.Types.ObjectId.isValid(loanId)) {
      return { ok: false as const, error: "Invalid loanId" };
    }

    const loan = await Loan.findById(loanId).select("_id borrowerId status").lean();
    if (!loan) {
      return { ok: false as const, error: "Loan not found" };
    }

    if (String(loan.borrowerId) !== borrowerId) {
      return { ok: false as const, error: "Linked loan does not belong to selected borrower" };
    }
  }

  const existing = await Collateral.findOne({ serialNumber }).lean();
  if (existing && String(existing._id) !== String(currentCollateralId || "")) {
    return { ok: false as const, error: "A collateral with this serial number already exists" };
  }

  return {
    ok: true as const,
    data: {
      borrowerId,
      ...(loanId ? { loanId } : {}),
      type,
      productName,
      value,
      serialNumber,
      status
    }
  };
};

export const createCollateral = async (req: Request, res: Response) => {
  try {
    const validated = await validateCollateralPayload(req.body || {});
    if (!validated.ok) {
      return res.status(400).json({ error: validated.error });
    }

    const collateral = await Collateral.create({
      ...validated.data
    });

    const populatedCollateral = await Collateral.findById(collateral._id).populate({
      path: "borrowerId",
      populate: { path: "userId" }
    }).populate({
      path: "loanId",
      select: "_id principal status createdAt"
    });

    res.status(201).json(populatedCollateral);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getCollateralById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params?.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid collateral id" });
    }

    const collateral = await Collateral.findById(id).populate({
      path: "borrowerId",
      populate: { path: "userId" }
    }).populate({
      path: "loanId",
      select: "_id principal status createdAt"
    });

    if (!collateral) {
      return res.status(404).json({ error: "Collateral not found" });
    }

    res.json(collateral);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getCollateral = async (_req: Request, res: Response) => {
  try {
    const data = await Collateral.find().populate({
      path: "borrowerId",
      populate: { path: "userId" }
    }).populate({
      path: "loanId",
      select: "_id principal status createdAt"
    });

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getCollateralLoanSummary = async (req: Request, res: Response) => {
  try {
    const loanIdsRaw = String(req.query.loanIds || "").trim();
    const requestedIds = loanIdsRaw
      ? loanIdsRaw
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
      : [];

    if (requestedIds.length > 1000) {
      return res.status(400).json({ error: "Too many loanIds requested. Maximum allowed is 1000." });
    }

    const loanIds = loanIdsRaw
      ? loanIdsRaw
          .split(",")
          .map((id) => id.trim())
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id))
      : [];

    const matchStage: Record<string, any> = { loanId: { $ne: null } };
    if (loanIds.length > 0) {
      matchStage.loanId = { $in: loanIds };
    }

    const summary = await Collateral.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "loans",
          localField: "loanId",
          foreignField: "_id",
          as: "loan"
        }
      },
      {
        $addFields: {
          linkedLoanStatus: {
            $toLower: {
              $ifNull: [{ $arrayElemAt: ["$loan.status", 0] }, ""]
            }
          }
        }
      },
      {
        $group: {
          _id: "$loanId",
          collateralCount: { $sum: 1 },
          riskyCollateralCount: {
            $sum: {
              $cond: [{ $in: ["$linkedLoanStatus", ["defaulted", "closed"]] }, 1, 0]
            }
          },
          totalValue: { $sum: { $ifNull: ["$value", 0] } }
        }
      },
      {
        $project: {
          _id: 0,
          loanId: "$_id",
          collateralCount: 1,
          riskyCollateralCount: 1,
          totalValue: 1
        }
      }
    ]);

    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getCollateralByLoanId = async (req: Request, res: Response) => {
  try {
    const loanId = String(req.params?.loanId || "").trim();
    if (!mongoose.Types.ObjectId.isValid(loanId)) {
      return res.status(400).json({ error: "Invalid loan id" });
    }

    const data = await Collateral.find({ loanId }).populate({
      path: "borrowerId",
      populate: { path: "userId" }
    }).populate({
      path: "loanId",
      select: "_id principal status createdAt"
    });

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateCollateral = async (req: Request, res: Response) => {
  try {
    const id = String(req.params?.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid collateral id" });
    }

    const existing = await Collateral.findById(id).lean();
    if (!existing) {
      return res.status(404).json({ error: "Collateral not found" });
    }

    const validated = await validateCollateralPayload(req.body || {}, id);
    if (!validated.ok) {
      return res.status(400).json({ error: validated.error });
    }

    const updated = await Collateral.findByIdAndUpdate(id, validated.data, {
      new: true,
      runValidators: true
    }).populate({
      path: "borrowerId",
      populate: { path: "userId" }
    }).populate({
      path: "loanId",
      select: "_id principal status createdAt"
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};