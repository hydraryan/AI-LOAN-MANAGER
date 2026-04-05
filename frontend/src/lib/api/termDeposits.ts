import API from "./api";

export type TermDeposit = {
  id: string;
  accountNumber: string;
  borrowerName: string;
  principalAmount: number;
  depositDate: string;
  maturityDate: string;
  interestRate: number;
  compoundingFrequency: "Monthly" | "Quarterly" | "Annually";
  currentValue: number;
  status: "Active" | "Matured" | "Withdrawn";
  autoRenewal: boolean;
};

export type TermDepositResponse = {
  data: TermDeposit[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export type TermDepositFilters = {
  status?: "Active" | "Matured" | "Withdrawn";
  search?: string;
  sort?: "maturityDate" | "principalAmount" | "createdAt";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
};

export const getTermDeposits = async (filters?: TermDepositFilters) => {
  const params = new URLSearchParams();
  if (filters?.status) params.append("status", filters.status);
  if (filters?.search) params.append("search", filters.search);
  if (filters?.sort) params.append("sort", filters.sort);
  if (filters?.order) params.append("order", filters.order);
  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.limit) params.append("limit", String(filters.limit));

  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await API.get<TermDepositResponse>(`/term-deposits${query}`);
  return res.data;
};

export const createTermDeposit = async (data: {
  borrowerId: string;
  accountNumber: string;
  principalAmount: number;
  depositDate?: string;
  maturityDate: string;
  interestRate: number;
  compoundingFrequency?: "Monthly" | "Quarterly" | "Annually";
  autoRenewal?: boolean;
}) => {
  const res = await API.post("/term-deposits", data);
  return res.data;
};

export const updateTermDeposit = async (
  id: string,
  data: {
    principalAmount?: number;
    interestRate?: number;
    status?: "Active" | "Matured" | "Withdrawn";
    autoRenewal?: boolean;
  }
) => {
  const res = await API.patch(`/term-deposits/${id}`, data);
  return res.data;
};

export const deleteTermDeposit = async (id: string) => {
  const res = await API.delete(`/term-deposits/${id}`);
  return res.data;
};

export const renewTermDeposit = async (
  id: string,
  data: {
    newMaturityDate: string;
    principalAmount?: number;
  }
) => {
  const res = await API.post(`/term-deposits/${id}/renew`, data);
  return res.data;
};

export const withdrawTermDeposit = async (
  id: string,
  data?: {
    withdrawalAmount?: number;
  }
) => {
  const res = await API.post(`/term-deposits/${id}/withdraw`, data || {});
  return res.data;
};
