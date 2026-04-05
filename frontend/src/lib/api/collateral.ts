import API from "./api";

export type CollateralStatus = "Deposited" | "Returned" | "Sold";

export type BorrowerRef = {
  _id: string;
  name?: string;
  userId?: {
    name?: string;
  };
};

export type LoanRef = {
  _id: string;
  principal?: number;
  status?: string;
  createdAt?: string;
};

export type CollateralRecord = {
  _id: string;
  borrowerId: BorrowerRef;
  loanId?: LoanRef | null;
  type: string;
  productName: string;
  value: number;
  serialNumber: string;
  status: CollateralStatus;
  dateDeposited: string;
};

export type CollateralPayload = {
  borrowerId: string;
  loanId?: string;
  type: string;
  productName: string;
  value: number;
  serialNumber: string;
  status: CollateralStatus;
};

export type CollateralLoanSummary = {
  loanId: string;
  collateralCount: number;
  riskyCollateralCount: number;
  totalValue: number;
};

export const getCollateral = async (): Promise<CollateralRecord[]> => {
  const res = await API.get<CollateralRecord[]>("/collateral");
  return res.data;
};

export const getCollateralByLoanId = async (loanId: string): Promise<CollateralRecord[]> => {
  const res = await API.get<CollateralRecord[]>(`/collateral/loan/${loanId}`);
  return res.data;
};

export const getCollateralLoanSummary = async (loanIds?: string[]): Promise<CollateralLoanSummary[]> => {
  const params = new URLSearchParams();
  if (loanIds && loanIds.length > 0) {
    params.set("loanIds", loanIds.join(","));
  }

  const query = params.toString();
  const res = await API.get<CollateralLoanSummary[]>(`/collateral/loan-summary${query ? `?${query}` : ""}`);
  return res.data;
};

export const getCollateralById = async (id: string): Promise<CollateralRecord> => {
  const res = await API.get<CollateralRecord>(`/collateral/${id}`);
  return res.data;
};

export const createCollateral = async (payload: CollateralPayload): Promise<CollateralRecord> => {
  const res = await API.post<CollateralRecord>("/collateral", payload);
  return res.data;
};

export const updateCollateral = async (id: string, payload: CollateralPayload): Promise<CollateralRecord> => {
  const res = await API.put<CollateralRecord>(`/collateral/${id}`, payload);
  return res.data;
};
