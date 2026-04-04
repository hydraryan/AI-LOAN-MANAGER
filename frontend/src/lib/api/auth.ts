import API from "./api";

export const signin = async (data: any) => {
  const res = await API.post("/auth/signin", data);
  return res;
};

export const getSession = async () => {
  const res = await API.get("/auth/session");
  return res;
};

export const logout = async () => {
  const res = await API.post("/auth/logout");
  return res;
};

export const logoutAllSessions = async () => {
  const res = await API.post("/auth/logout-all");
  return res;
};