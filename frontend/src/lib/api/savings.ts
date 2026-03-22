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

export const getSavingsAccounts = async () => {
  const res = await API.get<SavingsAccount[]>("/savings");
  return res.data;
};