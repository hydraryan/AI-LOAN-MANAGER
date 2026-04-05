import API from "./api";

export type CollectionSheetRow = {
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

export type CollectionSheetSummary = {
  rowCount: number;
  uniqueLoans: number;
  uniqueBorrowers: number;
  totalOutstanding: number;
  totalPrincipal: number;
};

export type CollectionSheetResponse = {
  date: string;
  rows: CollectionSheetRow[];
  summary: CollectionSheetSummary;
};

export type CollectionEntryPayload = {
  loanId: string;
  borrowerId: string;
  collectorId?: string;
  channel: "call" | "visit" | "sms" | "email";
  outcome: "promised" | "paid-partial" | "paid-full" | "no-response" | "refused" | "wrong-number";
  amountCollected?: number;
  notes?: string;
  followUpAt?: string;
  contactedAt?: string;
};

export type CollectionEntryItem = {
  _id: string;
  loanId: string;
  borrowerId: string;
  collectorId?: { _id?: string; name?: string; email?: string } | string;
  createdBy?: { _id?: string; name?: string; email?: string } | string;
  channel: "call" | "visit" | "sms" | "email";
  outcome: "promised" | "paid-partial" | "paid-full" | "no-response" | "refused" | "wrong-number";
  amountCollected: number;
  notes?: string;
  followUpAt?: string;
  contactedAt: string;
  createdAt: string;
  updatedAt: string;
};

export const getDailyCollectionSheet = async (date?: string, collectorId?: string) => {
  const res = await API.get<{ data: CollectionSheetResponse }>("/collections/daily", {
    params: {
      ...(date ? { date } : {}),
      ...(collectorId ? { collectorId } : {}),
    },
  });
  return res.data.data;
};

export const getMissedCollectionSheet = async (date?: string, collectorId?: string) => {
  const res = await API.get<{ data: CollectionSheetResponse }>("/collections/missed", {
    params: {
      ...(date ? { date } : {}),
      ...(collectorId ? { collectorId } : {}),
    },
  });
  return res.data.data;
};

export const getPastMaturityCollectionSheet = async (date?: string, collectorId?: string) => {
  const res = await API.get<{ data: CollectionSheetResponse }>("/collections/past-maturity", {
    params: {
      ...(date ? { date } : {}),
      ...(collectorId ? { collectorId } : {}),
    },
  });
  return res.data.data;
};

export const createCollectionEntry = async (payload: CollectionEntryPayload) => {
  const res = await API.post("/collections/entries", payload);
  return res.data;
};

export const getCollectionEntries = async (loanId?: string, borrowerId?: string) => {
  const res = await API.get<{ data: { entries: CollectionEntryItem[]; count: number } }>(
    "/collections/entries",
    {
      params: {
        ...(loanId ? { loanId } : {}),
        ...(borrowerId ? { borrowerId } : {}),
      },
    }
  );
  return res.data.data;
};

export const sendCollectionSms = async (recipients: string[], message: string) => {
  const res = await API.post("/collections/sms", { recipients, message });
  return res.data;
};

export const sendCollectionEmail = async (recipients: string[], subject: string, message: string) => {
  const res = await API.post("/collections/email", { recipients, subject, message });
  return res.data;
};
