import { Request, Response } from "express";
import { User } from "../models";

export const getUsers = async (_req: Request, res: Response) => {
  try {
    const users = await User.find().select("-passwordHash");

    const formatted = users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: "Active",
      lastActive: "Now"
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};