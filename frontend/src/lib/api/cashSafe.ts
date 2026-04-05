import API from './api';

export type CashSafe = {
  _id?: string;
  name: string;
  openingBalance: number;
  currentBalance: number;
  lastReconciledAt?: string;
  notes?: string;
};

export type CashSafeMovement = {
  _id?: string;
  cashSafeId: string;
  type: 'deposit' | 'withdrawal' | 'adjustment';
  amount: number;
  reference?: string;
  notes?: string;
  postedAt: string;
  postedBy?: string;
};

export type CashSafePayload = {
  cashSafe: CashSafe;
  movements: CashSafeMovement[];
};

export type CashSafeSummary = {
  openingBalance: number;
  currentBalance: number;
  deposits: number;
  withdrawals: number;
  adjustments: number;
  movementCount: number;
  lastReconciledAt?: string;
};

export const getCashSafe = async () => {
  const res = await API.get<CashSafePayload>('/cash-safe');
  return res.data;
};

export const getCashSafeSummary = async () => {
  const res = await API.get<CashSafeSummary>('/cash-safe/summary');
  return res.data;
};

export const recordCashSafeMovement = async (data: {
  type: 'deposit' | 'withdrawal' | 'adjustment';
  amount: number;
  reference?: string;
  notes?: string;
  postedAt?: string;
}) => {
  const res = await API.post('/cash-safe/movements', data);
  return res.data;
};

export const reconcileCashSafe = async (data: {
  currentBalance: number;
  notes?: string;
}) => {
  const res = await API.patch('/cash-safe/reconcile', data);
  return res.data;
};
