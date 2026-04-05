import API from './api';
import {
  Investment,
  PaginatedResponse,
} from '../../types/index';

export interface InvestmentFilters {
  investorId?: string;
  loanId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface CreateInvestmentPayload {
  investorId: string;
  loanId: string;
  amount: number;
  interestRate: number;
  expectedReturnDate: string;
  notes?: string;
}

export interface UpdateInvestmentPayload {
  amount?: number;
  interestRate?: number;
  expectedReturnDate?: string;
  status?: 'pending' | 'active' | 'completed' | 'defaulted';
  totalReturned?: number;
  notes?: string;
}

export const getInvestments = async (
  filters?: InvestmentFilters
): Promise<PaginatedResponse<Investment>> => {
  const params = new URLSearchParams();
  if (filters?.investorId) params.append('investorId', filters.investorId);
  if (filters?.loanId) params.append('loanId', filters.loanId);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));

  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await API.get<PaginatedResponse<Investment>>(
    `/investments${query}`
  );
  return res.data;
};

export const getInvestmentById = async (id: string): Promise<Investment> => {
  const res = await API.get<Investment>(`/investments/${id}`);
  return res.data;
};

export const getInvestmentsByInvestor = async (
  investorId: string,
  filters?: { page?: number; limit?: number }
): Promise<PaginatedResponse<Investment>> => {
  const params = new URLSearchParams();
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));

  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await API.get<PaginatedResponse<Investment>>(
    `/investments/investor/${investorId}${query}`
  );
  return res.data;
};

export const getInvestmentsByLoan = async (
  loanId: string,
  filters?: { page?: number; limit?: number }
): Promise<PaginatedResponse<Investment>> => {
  const params = new URLSearchParams();
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));

  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await API.get<PaginatedResponse<Investment>>(
    `/investments/loan/${loanId}${query}`
  );
  return res.data;
};

export const createInvestment = async (
  data: CreateInvestmentPayload
): Promise<Investment> => {
  const res = await API.post<Investment>('/investments', data);
  return res.data;
};

export const updateInvestment = async (
  id: string,
  data: UpdateInvestmentPayload
): Promise<Investment> => {
  const res = await API.put<Investment>(`/investments/${id}`, data);
  return res.data;
};

export const deleteInvestment = async (id: string): Promise<{ message: string }> => {
  const res = await API.delete<{ message: string }>(`/investments/${id}`);
  return res.data;
};
