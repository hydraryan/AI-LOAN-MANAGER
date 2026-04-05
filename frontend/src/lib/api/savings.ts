import API from "./api";

export type SavingsAccount = {
  id: string;
  accountNumber: string;
  borrowerName: string;
  productName: string;
  balance: number;
  interestRate: number;
  status: "Active" | "Dormant" | "Closed";
};

export type SavingsResponse = {
  data: SavingsAccount[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export type SavingsFilters = {
  status?: "Active" | "Dormant" | "Closed";
  product?: string;
  search?: string;
  sort?: "balance" | "interestRate" | "createdAt";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
};

export const getSavingsAccounts = async (filters?: SavingsFilters) => {
  const params = new URLSearchParams();
  if (filters?.status) params.append("status", filters.status);
  if (filters?.product) params.append("product", filters.product);
  if (filters?.search) params.append("search", filters.search);
  if (filters?.sort) params.append("sort", filters.sort);
  if (filters?.order) params.append("order", filters.order);
  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.limit) params.append("limit", String(filters.limit));
  
  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await API.get<SavingsResponse>(`/savings${query}`);
  return res.data;
};

export const createSavingsAccount = async (data: {
  borrowerId: string;
  accountNumber: string;
  balance: number;
  interestRate: number;
  productName?: string;
}) => {
  const res = await API.post("/savings", data);
  return res.data;
};

export const updateSavingsAccount = async (
  id: string,
  data: {
    balance?: number;
    interestRate?: number;
    status?: "Active" | "Dormant" | "Closed";
    productName?: string;
  }
) => {
  const res = await API.patch(`/savings/${id}`, data);
  return res.data;
};

export const deleteSavingsAccount = async (id: string) => {
  const res = await API.delete(`/savings/${id}`);
  return res.data;
}