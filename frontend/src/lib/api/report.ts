import API from "./api";

export const getDashboardStats = async () => {
  const res = await API.get("/reports/dashboard");
  return res.data;
};

export const getHomeDashboardMetrics = async () => {
  const res = await API.get("/reports/home");
  return res.data;
};