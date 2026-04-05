import { Request, Response } from "express";
import { Borrower, Group, Loan } from "../models";

// ✅ CREATE BORROWER
export const createBorrower = async (req: Request, res: Response) => {
  try {
    const { userId, name, email, phone, address, description } = req.body;

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
      address,
      description
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

export const getBorrowerById = async (req: Request, res: Response) => {
  try {
    const borrower = await Borrower.findById(req.params.id).populate("userId");
    if (!borrower) {
      return res.status(404).json({ error: "Borrower not found" });
    }

    return res.json(borrower);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateBorrower = async (req: Request, res: Response) => {
  try {
    const borrowerId = String(req.params.id);
    const { userId, name, email, phone, address, description } = req.body;
    const updates: Record<string, any> = {};

    const currentBorrower = await Borrower.findById(borrowerId);
    if (!currentBorrower) {
      return res.status(404).json({ error: "Borrower not found" });
    }

    if (currentBorrower.userId && (name !== undefined || email !== undefined)) {
      return res.status(400).json({ error: "Name and email are managed by the linked user account" });
    }

    if (userId !== undefined) updates.userId = userId;
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (description !== undefined) updates.description = description;

    if (updates.email) {
      const normalizedEmail = String(updates.email).toLowerCase().trim();
      updates.email = normalizedEmail;

      const existingBorrower = await Borrower.findOne({
        email: normalizedEmail,
        _id: { $ne: borrowerId }
      });

      if (existingBorrower) {
        return res.status(400).json({ error: "Borrower email already exists" });
      }
    }

    const borrower = await Borrower.findByIdAndUpdate(borrowerId, updates, {
      new: true,
      runValidators: true
    }).populate("userId");

    if (!borrower) {
      return res.status(404).json({ error: "Borrower not found" });
    }

    return res.json(borrower);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const deleteBorrower = async (req: Request, res: Response) => {
  try {
    const borrowerId = String(req.params.id);

    const borrowerLoans = await Loan.find({ borrowerId }).select("_id status principal createdAt");
    if (borrowerLoans.length > 0) {
      return res.status(409).json({
        code: "ACTIVE_LOANS_EXIST",
        error: "Borrower has existing loans. Close or transfer all loans before deleting this borrower.",
        blockingLoans: borrowerLoans.map((loan) => ({
          id: String(loan._id),
          status: loan.status,
          principal: loan.principal,
          createdAt: loan.createdAt
        }))
      });
    }

    const leaderGroups = await Group.find({ leaderId: borrowerId }).select("name");
    if (leaderGroups.length > 0) {
      const groupNames = leaderGroups.map((group) => group.name || "Unnamed Group").join(", ");
      return res.status(409).json({
        code: "LEADER_REASSIGN_REQUIRED",
        error: `Borrower is the leader of: ${groupNames}. Assign a new leader before deleting.`,
        blockingGroups: leaderGroups.map((group) => ({
          id: String(group._id),
          name: group.name || "Unnamed Group"
        }))
      });
    }

    await Group.updateMany(
      { members: borrowerId },
      { $pull: { members: borrowerId } }
    );

    const borrower = await Borrower.findByIdAndDelete(borrowerId);
    if (!borrower) {
      return res.status(404).json({ error: "Borrower not found" });
    }

    return res.json({ message: "Borrower deleted successfully" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};