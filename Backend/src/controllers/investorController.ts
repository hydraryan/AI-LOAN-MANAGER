import { Request, Response } from "express";
import Investor from "../models/Investors";

export const createInvestor = async (req: Request, res: Response) => {
  try {
    const { name, email, totalInvested, activeLoans, status } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "name and email are required" });
    }

    const investor = await Investor.create({
      name,
      email,
      totalInvested: Number(totalInvested || 0),
      activeLoans: Number(activeLoans || 0),
      status: status || "Active"
    });

    res.status(201).json(investor);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getInvestors = async (_req: Request, res: Response) => {
  try {
    const data = await Investor.find();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};