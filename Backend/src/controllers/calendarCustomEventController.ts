import { Request, Response } from "express";
import mongoose from "mongoose";
import { CalendarCustomEvent } from "../models";

const getUserIdFromRequest = (req: any): string | null => {
  const id = req?.user?.id || req?.user?._id || null;
  return typeof id === "string" && mongoose.Types.ObjectId.isValid(id)
    ? id
    : null;
};

const buildDateRangeFilter = (startDate?: string, endDate?: string) => {
  if (!startDate && !endDate) {
    return {};
  }

  const range: Record<string, Date> = {};
  if (startDate) {
    const parsed = new Date(String(startDate));
    if (!isNaN(parsed.getTime())) {
      range.$gte = parsed;
    }
  }
  if (endDate) {
    const parsed = new Date(String(endDate));
    if (!isNaN(parsed.getTime())) {
      range.$lte = parsed;
    }
  }

  return Object.keys(range).length > 0 ? { dateStart: range } : {};
};

const mapEvent = (event: any) => ({
  id: event._id.toString(),
  type: event.type,
  title: event.title,
  description: event.description,
  dateStart: event.dateStart,
  dateEnd: event.dateEnd,
  severity: event.severity,
  sourceEntityType: event.sourceEntityType,
  sourceEntityId: event.sourceEntityId,
  sourceEntityData: event.sourceEntityData,
  deepLinkPath: event.deepLinkPath,
  deepLinkParams: event.deepLinkParams,
  displayColor: event.displayColor,
  displayIcon: event.displayIcon,
  customMeta: event.customMeta,
});

export const getCustomCalendarEvents = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req as any);
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const { startDate, endDate, borrowerId, loanId, category, tag } = req.query;

    const query: Record<string, any> = {
      createdBy: userId,
      ...buildDateRangeFilter(
        typeof startDate === "string" ? startDate : undefined,
        typeof endDate === "string" ? endDate : undefined
      ),
    };

    if (typeof borrowerId === "string" && borrowerId.trim()) {
      query["sourceEntityData.borrowerId"] = borrowerId.trim();
    }

    if (typeof loanId === "string" && loanId.trim()) {
      query["sourceEntityData.loanId"] = loanId.trim();
    }

    if (typeof category === "string" && category.trim()) {
      query["customMeta.category"] = category.trim();
    }

    if (typeof tag === "string" && tag.trim()) {
      query["customMeta.tags"] = tag.trim();
    }

    const rows = await CalendarCustomEvent.find(query)
      .sort({ dateStart: 1 })
      .lean();

    return res.status(200).json({
      ok: true,
      data: {
        events: rows.map(mapEvent),
        count: rows.length,
      },
    });
  } catch (error) {
    console.error("getCustomCalendarEvents error:", error);
    return res.status(500).json({ ok: false, error: "Failed to load custom events" });
  }
};

export const createCustomCalendarEvent = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req as any);
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const payload = req.body || {};
    if (!payload.title || !payload.dateStart || !payload.dateEnd) {
      return res.status(400).json({
        ok: false,
        error: "title, dateStart and dateEnd are required",
      });
    }

    const created = await CalendarCustomEvent.create({
      ...payload,
      createdBy: userId,
      sourceEntityId: payload.sourceEntityId || "custom",
      deepLinkPath: payload.deepLinkPath || "/calendar",
      type: payload.type || "borrowerActionItem",
      displayIcon: payload.displayIcon || "plus",
      displayColor: payload.displayColor || "yellow",
      sourceEntityType: payload.sourceEntityType || "borrower",
    });

    return res.status(201).json({ ok: true, data: mapEvent(created.toObject()) });
  } catch (error) {
    console.error("createCustomCalendarEvent error:", error);
    return res.status(500).json({ ok: false, error: "Failed to create custom event" });
  }
};

export const createCustomCalendarEventsBulk = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = getUserIdFromRequest(req as any);
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const payload = Array.isArray(req.body?.events) ? req.body.events : [];
    if (payload.length === 0) {
      return res.status(400).json({ ok: false, error: "events array is required" });
    }

    const docs = payload.map((event: any) => ({
      ...event,
      createdBy: userId,
      sourceEntityId: event.sourceEntityId || "custom",
      deepLinkPath: event.deepLinkPath || "/calendar",
      type: event.type || "borrowerActionItem",
      displayIcon: event.displayIcon || "plus",
      displayColor: event.displayColor || "yellow",
      sourceEntityType: event.sourceEntityType || "borrower",
    }));

    const created = await CalendarCustomEvent.insertMany(docs);

    return res.status(201).json({
      ok: true,
      data: {
        events: created.map((row) => mapEvent(row.toObject())),
        count: created.length,
      },
    });
  } catch (error) {
    console.error("createCustomCalendarEventsBulk error:", error);
    return res.status(500).json({ ok: false, error: "Failed to create custom events" });
  }
};

export const updateCustomCalendarEvent = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req as any);
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const eventId = typeof req.params.id === "string" ? req.params.id : "";
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ ok: false, error: "Invalid event id" });
    }

    const target = await CalendarCustomEvent.findOne({
      _id: eventId,
      createdBy: userId,
    });

    if (!target) {
      return res.status(404).json({ ok: false, error: "Event not found" });
    }

    Object.assign(target, req.body || {});
    const updated = await target.save();

    return res.status(200).json({ ok: true, data: mapEvent(updated.toObject()) });
  } catch (error) {
    console.error("updateCustomCalendarEvent error:", error);
    return res.status(500).json({ ok: false, error: "Failed to update custom event" });
  }
};

export const deleteCustomCalendarEvent = async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req as any);
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const eventId = typeof req.params.id === "string" ? req.params.id : "";
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ ok: false, error: "Invalid event id" });
    }

    const deleted = await CalendarCustomEvent.findOne({
      _id: eventId,
      createdBy: userId,
    });

    if (!deleted) {
      return res.status(404).json({ ok: false, error: "Event not found" });
    }

    await deleted.deleteOne();

    return res.status(200).json({ ok: true, data: { id: eventId } });
  } catch (error) {
    console.error("deleteCustomCalendarEvent error:", error);
    return res.status(500).json({ ok: false, error: "Failed to delete custom event" });
  }
};

export const bulkDeleteCustomCalendarEvents = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = getUserIdFromRequest(req as any);
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const objectIds = ids.filter((id: string) => mongoose.Types.ObjectId.isValid(id));

    if (objectIds.length === 0) {
      return res.status(400).json({ ok: false, error: "Valid ids are required" });
    }

    const result = await CalendarCustomEvent.deleteMany({
      _id: { $in: objectIds },
      createdBy: userId,
    });

    return res.status(200).json({
      ok: true,
      data: {
        deletedCount: result.deletedCount || 0,
      },
    });
  } catch (error) {
    console.error("bulkDeleteCustomCalendarEvents error:", error);
    return res.status(500).json({ ok: false, error: "Failed to bulk delete events" });
  }
};

export const bulkUpdateCustomCalendarEventMeta = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = getUserIdFromRequest(req as any);
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const objectIds = ids.filter((id: string) => mongoose.Types.ObjectId.isValid(id));

    if (objectIds.length === 0) {
      return res.status(400).json({ ok: false, error: "Valid ids are required" });
    }

    const category =
      typeof req.body?.category === "string" ? req.body.category.trim() : "";
    const tags = Array.isArray(req.body?.tags)
      ? req.body.tags
          .map((tag: any) => String(tag || "").trim())
          .filter(Boolean)
      : null;

    const updates: Record<string, any> = {};
    if (category) {
      updates["customMeta.category"] = category;
    }
    if (tags) {
      updates["customMeta.tags"] = tags;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ ok: false, error: "No update values provided" });
    }

    const result = await CalendarCustomEvent.updateMany(
      { _id: { $in: objectIds }, createdBy: userId },
      { $set: updates }
    );

    return res.status(200).json({
      ok: true,
      data: {
        modifiedCount: result.modifiedCount || 0,
      },
    });
  } catch (error) {
    console.error("bulkUpdateCustomCalendarEventMeta error:", error);
    return res.status(500).json({ ok: false, error: "Failed to bulk update events" });
  }
};
