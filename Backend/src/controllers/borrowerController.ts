import { Request, Response } from "express";
import { Borrower } from "../models";

// ✅ CREATE BORROWER
export const createBorrower = async (req: Request, res: Response) => {
  try {
    const { userId, name, email, phone, address } = req.body;

    if (!userId && (!name || !email)) {
      return res.status(400).json({ error: "Either userId or both name and email are required" });
    }

    const duplicateFilter = userId
      ? { userId }
      : { email: String(email).toLowerCase().trim() };

    const existingBorrower = await Borrower.findOne(duplicateFilter);
    if (existingBorrower) {
      return res.status(400).json({ error: "Borrower profile already exists" });
    }

    const borrower = await Borrower.create({
      userId,
      name,
      email,
      phone,
      address
    });

    res.status(201).json(borrower);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ GET BORROWERS (FINAL VERSION)
export const getBorrowers = async (_req: Request, res: Response) => {
  try {
    const borrowers = await Borrower.find().populate("userId");

    res.json(borrowers); // ✅ keep raw structure
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};