import API from './api';
import {
  InvestorAccount,
  PaginatedResponse,
} from '../../types/index';

export interface InvestorAccountFilters {
  investorId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface CreateInvestorAccountPayload {
  investorId: string;
  accountNumber: string;
  accountType: 'savings' | 'checking' | 'investment' | 'other';
  bank: string;
  balance?: number;
  currency?: string;
  notes?: string;
}

export interface UpdateInvestorAccountPayload {
  accountNumber?: string;
  accountType?: 'savings' | 'checking' | 'investment' | 'other';
  bank?: string;
  balance?: number;
  currency?: string;
  status?: 'active' | 'inactive' | 'suspended';
  notes?: string;
}

export const getInvestorAccounts = async (
  filters?: InvestorAccountFilters
): Promise<PaginatedResponse<InvestorAccount>> => {
  const params = new URLSearchParams();
  if (filters?.investorId) params.append('investorId', filters.investorId);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));

  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await API.get<PaginatedResponse<InvestorAccount>>(
    `/investor-accounts${query}`
  );
  return res.data;
};

export const getInvestorAccountById = async (id: string): Promise<InvestorAccount> => {
  const res = await API.get<InvestorAccount>(`/investor-accounts/${id}`);
  return res.data;
};

export const getInvestorAccountsByInvestor = async (
  investorId: string,
  filters?: { page?: number; limit?: number }
): Promise<PaginatedResponse<InvestorAccount>> => {
  const params = new URLSearchParams();
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));

  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await API.get<PaginatedResponse<InvestorAccount>>(
    `/investor-accounts/investor/${investorId}${query}`
  );
  return res.data;
};

export const createInvestorAccount = async (
  data: CreateInvestorAccountPayload
): Promise<InvestorAccount> => {
  const res = await API.post<InvestorAccount>('/investor-accounts', data);
  return res.data;
};

export const updateInvestorAccount = async (
  id: string,
  data: UpdateInvestorAccountPayload
): Promise<InvestorAccount> => {
  const res = await API.put<InvestorAccount>(`/investor-accounts/${id}`, data);
  return res.data;
};

export const deleteInvestorAccount = async (id: string): Promise<{ message: string }> => {
  const res = await API.delete<{ message: string }>(`/investor-accounts/${id}`);
  return res.data;
};
