import API from './api';
import {
  Investor,
  InvestorCreatePayload,
  InvestorUpdatePayload,
  InvestorStatusPayload,
  InvestorsListResponse
} from '../../types/investor';

export interface InvestorFilters {
  search?: string;
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export const createInvestor = async (data: InvestorCreatePayload): Promise<Investor> => {
  const res = await API.post<Investor>('/investors', data);
  return res.data;
};

export const getInvestors = async (filters?: InvestorFilters): Promise<InvestorsListResponse> => {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.type) params.append('type', filters.type);
  if (filters?.page) params.append('page', String(filters.page));
  if (filters?.limit) params.append('limit', String(filters.limit));

  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await API.get<InvestorsListResponse>(`/investors${query}`);
  return res.data;
};

export const getInvestor = async (id: string): Promise<Investor> => {
  const res = await API.get<Investor>(`/investors/${id}`);
  return res.data;
};

export const updateInvestor = async (id: string, data: InvestorUpdatePayload): Promise<Investor> => {
  const res = await API.put<Investor>(`/investors/${id}`, data);
  return res.data;
};

export const updateInvestorStatus = async (id: string, data: InvestorStatusPayload): Promise<Investor> => {
  const res = await API.patch<Investor>(`/investors/${id}/status`, data);
  return res.data;
};

export const deleteInvestor = async (id: string): Promise<{ message: string }> => {
  const res = await API.delete<{ message: string }>(`/investors/${id}`);
  return res.data;
};
