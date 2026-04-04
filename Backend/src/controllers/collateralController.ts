import { Request, Response } from "express";
import Collateral from "../models/Collateral";

export const createCollateral = async (req: Request, res: Response) => {
  try {
    const { borrowerId, type, productName, value, serialNumber, status } = req.body;

    if (!borrowerId || !type || !productName || value === undefined || !serialNumber) {
      return res.status(400).json({ error: "borrowerId, type, productName, value and serialNumber are required" });
    }

    const collateral = await Collateral.create({
      borrowerId,
      type,
      productName,
      value: Number(value),
      serialNumber,
      status: status || "Deposited"
    });

    res.status(201).json(collateral);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getCollateral = async (_req: Request, res: Response) => {
  try {
    const data = await Collateral.find().populate({
      path: "borrowerId",
      populate: { path: "userId" }
    });

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};