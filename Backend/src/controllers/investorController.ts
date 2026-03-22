import { Request, Response } from "express";
import Investor from "../models/Investors";

export const getInvestors = async (_req: Request, res: Response) => {
  const data = await Investor.find();
  res.json(data);
};