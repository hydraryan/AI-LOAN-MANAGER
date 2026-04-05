import { Request, Response } from "express";
import Group from "../models/Group"; // ✅ FIX 1: IMPORT MODEL
import Borrower from "../models/Borrower";
import User from "../models/User";

// ✅ CREATE GROUP
export const createGroup = async (req: Request, res: Response) => {
  try {
    const { name, description, leaderId, collectorId, members } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "Group name is required" });
    }

    if (!leaderId) {
      return res.status(400).json({ error: "Group leader is required" });
    }

    if (!Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: "At least one member is required" });
    }

    const leaderExists = await Borrower.exists({ _id: leaderId });
    if (!leaderExists) {
      return res.status(400).json({ error: "Selected leader does not exist" });
    }

    const uniqueMemberIds = [...new Set(members.map((id: string) => String(id)))];
    const existingMembers = await Borrower.find({ _id: { $in: uniqueMemberIds } }).select("_id");
    if (existingMembers.length !== uniqueMemberIds.length) {
      return res.status(400).json({ error: "One or more selected members are invalid" });
    }

    const normalizedName = String(name).trim();
    const duplicate = await Group.findOne({ name: new RegExp(`^${normalizedName}$`, "i") });
    if (duplicate) {
      return res.status(400).json({ error: "A group with this name already exists" });
    }

    if (collectorId) {
      const collectorExists = await User.exists({ _id: collectorId });
      if (!collectorExists) {
        return res.status(400).json({ error: "Selected collector does not exist" });
      }
    }

    const group = await Group.create({
      name: normalizedName,
      description,
      leaderId,
      collectorId,
      members: uniqueMemberIds
    });
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
        path: "collectorId",
        select: "name email"
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

export const getGroupById = async (req: Request, res: Response) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate({
        path: "leaderId",
        populate: { path: "userId" }
      })
      .populate({
        path: "collectorId",
        select: "name email"
      })
      .populate({
        path: "members",
        populate: { path: "userId" }
      });

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    return res.json(group);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateGroup = async (req: Request, res: Response) => {
  try {
    const groupId = String(req.params.id);
    const { name, description, leaderId, collectorId, members } = req.body;
    const updates: Record<string, any> = {};

    if (name !== undefined) {
      const normalizedName = String(name).trim();
      if (!normalizedName) {
        return res.status(400).json({ error: "Group name cannot be empty" });
      }

      const duplicate = await Group.findOne({
        name: new RegExp(`^${normalizedName}$`, "i"),
        _id: { $ne: groupId }
      });
      if (duplicate) {
        return res.status(400).json({ error: "A group with this name already exists" });
      }

      updates.name = normalizedName;
    }

    if (description !== undefined) updates.description = description;
    if (collectorId !== undefined) {
      if (collectorId) {
        const collectorExists = await User.exists({ _id: collectorId });
        if (!collectorExists) {
          return res.status(400).json({ error: "Selected collector does not exist" });
        }
      }
      updates.collectorId = collectorId;
    }

    if (leaderId !== undefined) {
      const leaderExists = await Borrower.exists({ _id: leaderId });
      if (!leaderExists) {
        return res.status(400).json({ error: "Selected leader does not exist" });
      }
      updates.leaderId = leaderId;
    }

    if (members !== undefined) {
      if (!Array.isArray(members) || members.length === 0) {
        return res.status(400).json({ error: "Members must be a non-empty array" });
      }

      const uniqueMemberIds = [...new Set(members.map((id: string) => String(id)))];
      const existingMembers = await Borrower.find({ _id: { $in: uniqueMemberIds } }).select("_id");
      if (existingMembers.length !== uniqueMemberIds.length) {
        return res.status(400).json({ error: "One or more selected members are invalid" });
      }

      updates.members = uniqueMemberIds;
    }

    const group = await Group.findByIdAndUpdate(groupId, updates, {
      new: true,
      runValidators: true
    })
      .populate({
        path: "leaderId",
        populate: { path: "userId" }
      })
      .populate({
        path: "collectorId",
        select: "name email"
      })
      .populate({
        path: "members",
        populate: { path: "userId" }
      });

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    return res.json(group);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const deleteGroup = async (req: Request, res: Response) => {
  try {
    const group = await Group.findByIdAndDelete(req.params.id);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    return res.json({ message: "Group deleted successfully" });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};