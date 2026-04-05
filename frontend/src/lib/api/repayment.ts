import API from "./api";

export type RepaymentBulkResult = {
  inputIndex: number;
  loanId: string;
  requested: number;
  paid: number;
  overpayment: number;
  loanStatus: string;
};

export type RepaymentBulkSkipped = {
  inputIndex: number;
  loanId: string | null;
  reason: string;
};

export type RepaymentBulkWarning = {
  inputIndex: number;
  loanId: string;
  reason: string;
};

export type RepaymentBulkResponse = {
  success: boolean;
  results: RepaymentBulkResult[];
  skipped: RepaymentBulkSkipped[];
  warnings: RepaymentBulkWarning[];
  processedCount: number;
  skippedCount: number;
  warningCount: number;
  idempotentReplay?: boolean;
};

export const bulkRepayment = async (
  entries: any[],
  idempotencyKey?: string
): Promise<RepaymentBulkResponse> => {
  const key = idempotencyKey || crypto.randomUUID();
  const res = await API.post<RepaymentBulkResponse>(
    "/repayments/bulk",
    { entries, idempotencyKey: key },
    { headers: { "x-idempotency-key": key } }
  );
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

export type RepaymentCreditsByLoan = {
  loanId: string;
  credit: number;
};

export type RepaymentCreditSummary = {
  borrowerId: string;
  totalCredit: number;
  creditsByLoan: RepaymentCreditsByLoan[];
};

export const getRepayments = async (): Promise<RepaymentDisplay[]> => {
  const res = await API.get<RepaymentDisplay[]>("/repayments");
  return res.data;
};

export const getRepaymentCredits = async (borrowerId: string): Promise<RepaymentCreditSummary> => {
  const res = await API.get<RepaymentCreditSummary>(`/repayments/credits/${borrowerId}`);
  return res.data;
};