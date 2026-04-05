import { Response } from "express";
import mongoose from "mongoose";
import UserPreference from "../models/UserPreference";

const allowedThemes = ["light", "dark", "system"];

export const getMyPreferences = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(String(userId || ""))) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    let pref = await UserPreference.findOne({ userId });

    if (!pref) {
      pref = await UserPreference.create({ userId });
    }

    res.json({
      currency: pref.currency,
      dateFormat: pref.dateFormat,
      timezone: pref.timezone,
      theme: pref.theme
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch preferences" });
  }
};

export const updateMyPreferences = async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(String(userId || ""))) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const currency = String(req.body?.currency || "INR").trim().toUpperCase();
    const dateFormat = String(req.body?.dateFormat || "DD/MM/YYYY").trim();
    const timezone = String(req.body?.timezone || "Asia/Kolkata").trim();
    const theme = String(req.body?.theme || "system").trim().toLowerCase();

    if (!allowedThemes.includes(theme)) {
      return res.status(400).json({ error: "Invalid theme" });
    }

    const pref = await UserPreference.findOneAndUpdate(
      { userId },
      { currency, dateFormat, timezone, theme },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({
      currency: pref.currency,
      dateFormat: pref.dateFormat,
      timezone: pref.timezone,
      theme: pref.theme
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update preferences" });
  }
};
