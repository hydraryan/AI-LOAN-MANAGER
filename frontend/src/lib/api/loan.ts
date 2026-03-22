import API from "./api";

export const getLoans = () => API.get("/loans");
export const createLoan = async (data: any) => {
  const res = await API.post("/loans", data);
  return res.data;
};