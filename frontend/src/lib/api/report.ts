import API from "./api";

export type HomeDashboardMetrics = {
  todayCollection?: number;
  portfolioAtRisk?: number;
  collectionTrend?: Array<{ day: string; expected: number; actual: number }>;
  actionItems?: Array<{ label: string; count: number; value: number; critical?: boolean }>;
  overdueBuckets?: {
    d1to30?: number;
    d31to90?: number;
    d90plus?: number;
  };
};

export const getDashboardStats = async () => {
  const res = await API.get("/reports/dashboard");
  return res.data;
};

export const getHomeDashboardMetrics = async () => {
  const res = await API.get<HomeDashboardMetrics>("/reports/home");
  return res.data;
};