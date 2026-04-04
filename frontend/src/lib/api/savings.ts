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

export const createSavingsAccount = async (data: {
  borrowerId: string;
  accountNumber: string;
  balance: number;
  interestRate: number;
}) => {
  const res = await API.post("/savings", data);
  return res.data;
};