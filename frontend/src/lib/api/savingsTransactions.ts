import API from './api';

export type SavingsTransaction = {
  id: string;
  savingsAccountId: string;
  borrowerId: string;
  borrowerName: string;
  accountNumber: string;
  amount: number;
  requestedAmount: number;
  unappliedAmount: number;
  method: string;
  status: string;
  postedDate?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type SavingsTransactionFilters = {
  status?: string;
  method?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export type SavingsTransactionResponse = {
  data: SavingsTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export type SavingsTransactionCreatePayload = {
  savingsAccountId: string;
  amount: number;
  requestedAmount?: number;
  unappliedAmount?: number;
  method?: string;
  status?: string;
  postedDate?: string;
};

export type SavingsTransactionBulkEntry = {
  savingsAccountId: string;
  amount: number;
  requestedAmount?: number;
  unappliedAmount?: number;
  method?: string;
  status?: string;
  date?: string;
};

export type SavingsTransactionBulkSkipped = {
  inputIndex: number;
  savingsAccountId: string | null;
  reason: string;
};

export type SavingsTransactionBulkResponse = {
  success: boolean;
  results: SavingsTransaction[];
  skipped: SavingsTransactionBulkSkipped[];
  processedCount: number;
  skippedCount: number;
  warningCount: number;
};

export type SavingsTransactionReport = {
  totalTransactions: number;
  totalAmount: number;
  totalRequested: number;
  totalUnapplied: number;
  pending: number;
  approved: number;
  byMethod: Array<{ name: string; count: number }>;
  recentTransactions: SavingsTransaction[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export const getSavingsTransactions = async (filters?: SavingsTransactionFilters) => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.method) params.append('method', filters.method);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));

  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await API.get<SavingsTransactionResponse>(`/savings-transactions${query}`);
  return res.data;
};

export const createSavingsTransaction = async (data: SavingsTransactionCreatePayload) => {
  const res = await API.post<SavingsTransaction>('/savings-transactions', data);
  return res.data;
};

export const bulkCreateSavingsTransactions = async (entries: SavingsTransactionBulkEntry[]) => {
  const idempotencyKey =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const res = await API.post<SavingsTransactionBulkResponse>('/savings-transactions/bulk', { entries }, {
    headers: {
      'x-idempotency-key': idempotencyKey
    }
  });
  return res.data;
};

export const approveSavingsTransaction = async (id: string) => {
  const res = await API.post<SavingsTransaction>(`/savings-transactions/${id}/approve`);
  return res.data;
};

export const rejectSavingsTransaction = async (id: string) => {
  const res = await API.post<SavingsTransaction>(`/savings-transactions/${id}/reject`);
  return res.data;
};

export const getSavingsTransactionReport = async () => {
  const res = await API.get<SavingsTransactionReport>('/savings-transactions/report');
  return res.data;
};
