import { Request, Response } from "express";
import mongoose from "mongoose";
import { Borrower, CollectionEntry, Group, Loan } from "../models";

type SheetRow = {
  loanId: string;
  borrowerId: string;
  borrowerName: string;
  borrowerPhone: string;
  principal: number;
  dueDate: string;
  outstanding: number;
  daysOverdue: number;
  collectorId: string;
  collectorName: string;
};

const getUserId = (req: any): string => {
  const id = req?.user?.id || req?.user?._id;
  return typeof id === "string" ? id : "";
};

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const normalizeDate = (value?: string) => {
  const parsed = value ? new Date(value) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const daysBetween = (older: Date, newer: Date) => {
  const ms = startOfDay(newer).getTime() - startOfDay(older).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
};

const getCollectorMap = async () => {
  const groups = await Group.find({ collectorId: { $exists: true, $ne: null } })
    .populate("collectorId", "name")
    .lean();

  const borrowerCollector = new Map<string, { collectorId: string; collectorName: string }>();
  for (const group of groups as any[]) {
    const collectorId = group.collectorId?._id?.toString?.() || "";
    const collectorName = group.collectorId?.name || "Unassigned";
    for (const memberId of group.members || []) {
      const key = memberId?.toString?.();
      if (!key) continue;
      if (!borrowerCollector.has(key)) {
        borrowerCollector.set(key, { collectorId, collectorName });
      }
    }
  }

  return borrowerCollector;
};

const getBorrowerMap = async () => {
  const borrowers = await Borrower.find().populate("userId", "name phone").lean();
  const map = new Map<string, { name: string; phone: string }>();

  for (const b of borrowers as any[]) {
    const borrowerId = b._id?.toString?.();
    if (!borrowerId) continue;
    const name = b.userId?.name || b.name || "Unknown Borrower";
    const phone = b.userId?.phone || b.phone || "";
    map.set(borrowerId, { name, phone });
  }

  return map;
};

const buildSheetRows = async (kind: "daily" | "missed" | "past-maturity", date: Date) => {
  const loans = await Loan.find({ status: { $in: ["active", "pending", "approved", "defaulted"] } }).lean();
  const borrowerMap = await getBorrowerMap();
  const collectorMap = await getCollectorMap();

  const rows: SheetRow[] = [];
  const targetStart = startOfDay(date);
  const targetEnd = endOfDay(date);

  for (const loan of loans as any[]) {
    const borrowerId = loan.borrowerId?.toString?.() || "";
    if (!borrowerId) continue;

    const borrower = borrowerMap.get(borrowerId) || { name: "Unknown Borrower", phone: "" };
    const collector = collectorMap.get(borrowerId) || { collectorId: "", collectorName: "Unassigned" };

    const schedule = Array.isArray(loan.schedule) ? loan.schedule : [];

    if (kind === "past-maturity") {
      if (schedule.length === 0) continue;
      const lastDue = schedule
        .map((item: any) => new Date(item.dueDate))
        .sort((a: Date, b: Date) => b.getTime() - a.getTime())[0];
      if (!lastDue || lastDue >= targetStart) continue;

      const outstanding = schedule.reduce((sum: number, item: any) => {
        const due = Number(item.amount || 0);
        const paid = Number(item.paidAmount || 0);
        return sum + Math.max(0, due - paid);
      }, 0);

      if (outstanding <= 0) continue;

      rows.push({
        loanId: loan._id.toString(),
        borrowerId,
        borrowerName: borrower.name,
        borrowerPhone: borrower.phone,
        principal: Number(loan.principal || 0),
        dueDate: lastDue.toISOString(),
        outstanding,
        daysOverdue: daysBetween(lastDue, targetStart),
        collectorId: collector.collectorId,
        collectorName: collector.collectorName,
      });

      continue;
    }

    for (const installment of schedule) {
      const dueDate = new Date(installment.dueDate);
      const due = Number(installment.amount || 0);
      const paid = Number(installment.paidAmount || 0);
      const outstanding = Math.max(0, due - paid);
      if (outstanding <= 0) continue;

      const isDaily = kind === "daily" && dueDate >= targetStart && dueDate <= targetEnd;
      const isMissed = kind === "missed" && dueDate < targetStart;
      if (!isDaily && !isMissed) continue;

      rows.push({
        loanId: loan._id.toString(),
        borrowerId,
        borrowerName: borrower.name,
        borrowerPhone: borrower.phone,
        principal: Number(loan.principal || 0),
        dueDate: dueDate.toISOString(),
        outstanding,
        daysOverdue: daysBetween(dueDate, targetStart),
        collectorId: collector.collectorId,
        collectorName: collector.collectorName,
      });
    }
  }

  return rows.sort((a, b) => b.daysOverdue - a.daysOverdue || b.outstanding - a.outstanding);
};

const buildSummary = (rows: SheetRow[]) => {
  const totalOutstanding = rows.reduce((sum, row) => sum + row.outstanding, 0);
  const totalPrincipal = rows.reduce((sum, row) => sum + row.principal, 0);
  const uniqueLoans = new Set(rows.map((row) => row.loanId)).size;
  const uniqueBorrowers = new Set(rows.map((row) => row.borrowerId)).size;
  return {
    rowCount: rows.length,
    uniqueLoans,
    uniqueBorrowers,
    totalOutstanding,
    totalPrincipal,
  };
};

const applyCollectorFilter = (rows: SheetRow[], collectorId?: string) => {
  if (!collectorId) return rows;
  return rows.filter((row) => row.collectorId === collectorId);
};

export const getDailyCollectionSheet = async (req: Request, res: Response) => {
  try {
    const date = normalizeDate(typeof req.query.date === "string" ? req.query.date : undefined);
    const collectorId = typeof req.query.collectorId === "string" ? req.query.collectorId : undefined;
    const rows = applyCollectorFilter(await buildSheetRows("daily", date), collectorId);

    return res.status(200).json({
      ok: true,
      data: {
        date: startOfDay(date).toISOString(),
        rows,
        summary: buildSummary(rows),
      },
    });
  } catch (error) {
    console.error("getDailyCollectionSheet error:", error);
    return res.status(500).json({ ok: false, error: "Failed to load daily sheet" });
  }
};

export const getMissedRepaymentSheet = async (req: Request, res: Response) => {
  try {
    const date = normalizeDate(typeof req.query.date === "string" ? req.query.date : undefined);
    const collectorId = typeof req.query.collectorId === "string" ? req.query.collectorId : undefined;
    const rows = applyCollectorFilter(await buildSheetRows("missed", date), collectorId);

    return res.status(200).json({
      ok: true,
      data: {
        date: startOfDay(date).toISOString(),
        rows,
        summary: buildSummary(rows),
      },
    });
  } catch (error) {
    console.error("getMissedRepaymentSheet error:", error);
    return res.status(500).json({ ok: false, error: "Failed to load missed sheet" });
  }
};

export const getPastMaturitySheet = async (req: Request, res: Response) => {
  try {
    const date = normalizeDate(typeof req.query.date === "string" ? req.query.date : undefined);
    const collectorId = typeof req.query.collectorId === "string" ? req.query.collectorId : undefined;
    const rows = applyCollectorFilter(await buildSheetRows("past-maturity", date), collectorId);

    return res.status(200).json({
      ok: true,
      data: {
        date: startOfDay(date).toISOString(),
        rows,
        summary: buildSummary(rows),
      },
    });
  } catch (error) {
    console.error("getPastMaturitySheet error:", error);
    return res.status(500).json({ ok: false, error: "Failed to load past-maturity sheet" });
  }
};

export const createCollectionEntry = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req as any);
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const {
      loanId,
      borrowerId,
      collectorId,
      channel,
      outcome,
      amountCollected,
      notes,
      followUpAt,
      contactedAt,
    } = req.body || {};

    if (!loanId || !borrowerId) {
      return res.status(400).json({ ok: false, error: "loanId and borrowerId are required" });
    }

    const entry = await CollectionEntry.create({
      loanId,
      borrowerId,
      ...(collectorId ? { collectorId } : {}),
      channel: channel || "call",
      outcome: outcome || "promised",
      amountCollected: Number(amountCollected || 0),
      ...(notes ? { notes: String(notes) } : {}),
      ...(followUpAt ? { followUpAt: new Date(followUpAt) } : {}),
      ...(contactedAt ? { contactedAt: new Date(contactedAt) } : {}),
      createdBy: userId,
    });

    return res.status(201).json({ ok: true, data: entry });
  } catch (error) {
    console.error("createCollectionEntry error:", error);
    return res.status(500).json({ ok: false, error: "Failed to save collection entry" });
  }
};

export const getCollectionEntries = async (req: Request, res: Response) => {
  try {
    const loanId = typeof req.query.loanId === "string" ? req.query.loanId : undefined;
    const borrowerId = typeof req.query.borrowerId === "string" ? req.query.borrowerId : undefined;

    const query: Record<string, unknown> = {};
    if (loanId && mongoose.Types.ObjectId.isValid(loanId)) query.loanId = loanId;
    if (borrowerId && mongoose.Types.ObjectId.isValid(borrowerId)) query.borrowerId = borrowerId;

    const entries = await CollectionEntry.find(query)
      .sort({ contactedAt: -1 })
      .populate("collectorId", "name email")
      .populate("createdBy", "name email")
      .lean();

    return res.status(200).json({
      ok: true,
      data: {
        entries,
        count: entries.length,
      },
    });
  } catch (error) {
    console.error("getCollectionEntries error:", error);
    return res.status(500).json({ ok: false, error: "Failed to load collection entries" });
  }
};

export const sendCollectionSms = async (req: Request, res: Response) => {
  try {
    const recipients = Array.isArray(req.body?.recipients) ? req.body.recipients : [];
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";

    if (!message || recipients.length === 0) {
      return res.status(400).json({ ok: false, error: "recipients and message are required" });
    }

    return res.status(200).json({
      ok: true,
      data: {
        provider: "stub",
        sentCount: recipients.length,
        failedCount: 0,
        message,
      },
    });
  } catch (error) {
    console.error("sendCollectionSms error:", error);
    return res.status(500).json({ ok: false, error: "Failed to send SMS" });
  }
};

export const sendCollectionEmail = async (req: Request, res: Response) => {
  try {
    const recipients = Array.isArray(req.body?.recipients) ? req.body.recipients : [];
    const subject = typeof req.body?.subject === "string" ? req.body.subject.trim() : "";
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";

    if (!subject || !message || recipients.length === 0) {
      return res.status(400).json({ ok: false, error: "recipients, subject and message are required" });
    }

    return res.status(200).json({
      ok: true,
      data: {
        provider: "stub",
        sentCount: recipients.length,
        failedCount: 0,
        subject,
      },
    });
  } catch (error) {
    console.error("sendCollectionEmail error:", error);
    return res.status(500).json({ ok: false, error: "Failed to send email" });
  }
};
