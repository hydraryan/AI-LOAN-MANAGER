import { Request, Response } from "express";
import Group from "../models/Group"; // ✅ FIX 1: IMPORT MODEL

// ✅ CREATE GROUP
export const createGroup = async (req: Request, res: Response) => {
  try {
    const group = await Group.create(req.body);
    res.status(201).json(group);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ GET ALL GROUPS
export const getGroups = async (_req: Request, res: Response) => {
  try {
    const groups = await Group.find() // ✅ FIX 2: correct method
      .populate({
        path: "leaderId",
        populate: { path: "userId" }
      })
      .populate({
        path: "members",
        populate: { path: "userId" }
      });

    res.json(groups);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};