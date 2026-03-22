import API from "./api";

export const bulkRepayment = async (entries: any[]) => {
  const res = await API.post("/repayments/bulk", { entries });
  return res.data;
};
export type RepaymentDisplay = {
  id: string;
  loanId: string;
  borrowerName: string;
  amount: number;
  date: string;
  method: string;
  status: string;
};

export const getRepayments = async (): Promise<RepaymentDisplay[]> => {
  const res = await API.get<RepaymentDisplay[]>("/repayments");
  return res.data;
};