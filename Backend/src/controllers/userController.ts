import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User } from "../models";

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const isStrongPassword = (value: string) => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{10,128}$/.test(value);
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email and password are required" });
    }

    const normalizedEmail = normalizeEmail(String(email));
    const normalizedPassword = String(password).trim();

    if (!isStrongPassword(normalizedPassword)) {
      return res.status(400).json({
        error: "Password must be 10+ chars with upper, lower, number, and special character"
      });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const passwordHash = await bcrypt.hash(normalizedPassword, 10);

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      role: "admin"
    });

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getUsers = async (_req: Request, res: Response) => {
  try {
    const users = await User.find().select("-passwordHash");

    const formatted = users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id || "").trim();

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const user = await User.findById(id).select("-passwordHash");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id || "").trim();
    const { name, email, password } = req.body || {};

    if (!id) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (name) user.name = String(name).trim();

    if (email) {
      const normalizedEmail = String(email).trim().toLowerCase();
      const duplicate = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: new mongoose.Types.ObjectId(id) }
      });
      if (duplicate) {
        return res.status(400).json({ error: "Email already exists" });
      }
      user.email = normalizedEmail;
    }

    if (password) {
      const normalizedPassword = String(password).trim();
      if (!isStrongPassword(normalizedPassword)) {
        return res.status(400).json({
          error: "Password must be 10+ chars with upper, lower, number, and special character"
        });
      }
      user.passwordHash = await bcrypt.hash(normalizedPassword, 10);
    }

    user.role = "admin";
    await user.save();

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id || "").trim();

    if (!id) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};