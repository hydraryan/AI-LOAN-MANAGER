export type InvestorType = "Individual" | "Corporate" | "Bank" | "MutualFund";
export type KycStatus = "Pending" | "Verified" | "Rejected";
export type InvestorStatus = "Active" | "Inactive" | "Suspended";

export interface Investor {
  _id: string;
  name: string;
  email: string;
  investorType: InvestorType;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  accountNumber?: string;
  accountHolderName?: string;
  ifscCode?: string;
  kycStatus: KycStatus;
  status: InvestorStatus;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvestorCreatePayload {
  name: string;
  email: string;
  investorType?: InvestorType;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  accountNumber?: string;
  accountHolderName?: string;
  ifscCode?: string;
  kycStatus?: KycStatus;
  status?: InvestorStatus;
}

export interface InvestorUpdatePayload {
  investorType?: InvestorType;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  accountNumber?: string;
  accountHolderName?: string;
  ifscCode?: string;
  kycStatus?: KycStatus;
  status?: InvestorStatus;
}

export interface InvestorStatusPayload {
  status: InvestorStatus;
}

export interface InvestorsListResponse {
  data: Investor[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface InvestorAccount {
  _id: string;
  investorId: string;
  accountNumber: string;
  fundBalance: number;
  status: "Active" | "Inactive";
  expectedReturnRate: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Investment {
  _id: string;
  investorId: string;
  loanId: string;
  amount: number;
  investmentDate: string;
  expectedReturnPercent: number;
  status: "Pending" | "Active" | "Completed" | "Cancelled";
  createdAt?: string;
  updatedAt?: string;
}

export interface InvestorTransaction {
  _id: string;
  investorAccountId: string;
  transactionType: "Deposit" | "Withdrawal" | "InterestPayout" | "ReturnOfCapital";
  amount: number;
  referenceId?: string;
  description?: string;
  status: "Completed" | "Pending" | "Failed";
  createdAt?: string;
  updatedAt?: string;
}
