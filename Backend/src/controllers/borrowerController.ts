import { Request, Response } from "express";
import { Borrower } from "../models";

// ✅ CREATE BORROWER
export const createBorrower = async (req: Request, res: Response) => {
  try {
    const { userId, phone, address } = req.body;

    const borrower = await Borrower.create({
      userId,
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