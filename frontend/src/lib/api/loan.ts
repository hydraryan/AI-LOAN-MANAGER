import API from "./api";

export const getLoans = () => API.get("/loans");
export const getLoanById = (id: string) => API.get(`/loans/${id}`);
export const updateLoanStatus = (id: string, status: string) => API.patch(`/loans/${id}/status`, { status });
export const updateLoan = (id: string, data: any) => API.put(`/loans/${id}`, data);
export const createLoan = async (data: any) => {
  const res = await API.post("/loans", data);
  return res.data;
};