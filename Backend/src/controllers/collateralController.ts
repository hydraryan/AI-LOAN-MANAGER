import { Request, Response } from "express";
import Collateral from "../models/Collateral";

export const getCollateral = async (_req: Request, res: Response) => {
  const data = await Collateral.find().populate({
    path: "borrowerId",
    populate: { path: "userId" }
  });

  res.json(data);
};