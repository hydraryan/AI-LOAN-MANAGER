import { Request, Response } from "express";
import Savings from "../models/Savings";

export const createSavings = async (req: Request, res: Response) => {
  try {
    const { borrowerId, accountNumber, balance, interestRate, productName } = req.body;

    if (!borrowerId || !accountNumber) {
      return res.status(400).json({ error: "borrowerId and accountNumber are required" });
    }

    const parsedBalance = Number(balance ?? 0);
    const parsedInterestRate = Number(interestRate ?? 5);

    if (
      Number.isNaN(parsedBalance) ||
      Number.isNaN(parsedInterestRate) ||
      parsedBalance < 0 ||
      parsedInterestRate < 0
    ) {
      return res.status(400).json({ error: "Invalid savings input values" });
    }

    const savings = await Savings.create({
      borrowerId,
      accountNumber,
      balance: parsedBalance,
      interestRate: parsedInterestRate,
      productName: productName || "Savings Account"
    });

    res.status(201).json(savings);
  } catch (err: any) {
    if (err?.code === 11000) {
      return res.status(400).json({ error: "Account number already exists" });
    }
    res.status(500).json({ error: err.message });
  }
};

export const getSavings = async (req: Request, res: Response) => {
  try {
    // Extract query parameters for filtering, sorting, and pagination
    const { status, product, search, sort = "createdAt", order = "desc", page = "1", limit = "20" } = req.query;
    
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
    const skip = (pageNum - 1) * limitNum;
    
    // Build filter object
    const filter: any = {};
    if (status) filter.status = status;
    if (product) filter.productName = new RegExp(product as string, "i");
    if (search) {
      // Search by account number or borrower name
      filter.$or = [
        { accountNumber: new RegExp(search as string, "i") }
      ];
    }
    
    // Build sort object
    const sortObj: any = {};
    const sortField = sort === "balance" || sort === "interestRate" ? sort : "createdAt";
    sortObj[sortField] = order === "asc" ? 1 : -1;
    
    // Execute query
    const data = await Savings.find(filter)
      .populate({
        path: "borrowerId",
        select: "userId name",
        populate: { path: "userId", select: "name" }
      })
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);
    
    const total = await Savings.countDocuments(filter);
    
    const formatted = data.map((s: any) => ({
      id: s._id,
      accountNumber: s.accountNumber,
      borrowerName: s.borrowerId?.userId?.name || s.borrowerId?.name,
      productName: s.productName,
      balance: s.balance,
      interestRate: s.interestRate,
      status: s.status
    }));

    res.json({
      data: formatted,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateSavings = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { balance, interestRate, status, productName } = req.body;
    
    // Validate numeric fields if provided
    if (balance !== undefined) {
      const parsedBalance = Number(balance);
      if (Number.isNaN(parsedBalance) || parsedBalance < 0) {
        return res.status(400).json({ error: "Invalid balance value" });
      }
    }
    
    if (interestRate !== undefined) {
      const parsedRate = Number(interestRate);
      if (Number.isNaN(parsedRate) || parsedRate < 0) {
        return res.status(400).json({ error: "Invalid interest rate value" });
      }
    }
    
    const validStatuses = ["Active", "Dormant", "Closed"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(", ")}` });
    }
    
    const updateData: any = {};
    if (balance !== undefined) updateData.balance = Number(balance);
    if (interestRate !== undefined) updateData.interestRate = Number(interestRate);
    if (status) updateData.status = status;
    if (productName) updateData.productName = productName;
    
    const updated = await Savings.findByIdAndUpdate(id, updateData, { new: true }).populate({
      path: "borrowerId",
      populate: { path: "userId" }
    });
    
    if (!updated) {
      return res.status(404).json({ error: "Savings account not found" });
    }
    
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteSavings = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const deleted = await Savings.findByIdAndDelete(id);
    
    if (!deleted) {
      return res.status(404).json({ error: "Savings account not found" });
    }
    
    res.json({ message: "Savings account deleted successfully", id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}