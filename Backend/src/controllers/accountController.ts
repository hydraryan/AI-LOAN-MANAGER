import { Request, Response } from "express";
import Account from "../models/Account";

export const getAccounts = async (_req: Request, res: Response) => {
  const data = await Account.find();
  res.json(data);
};

export const createAccount = async (req: Request, res: Response) => {
  const account = await Account.create(req.body);
  res.json(account);
};