import API from "./api";

export type SigninPayload = {
  email: string;
  password: string;
};

export const getAuthErrorMessage = (error: any): string => {
  const status = error?.response?.status;
  const message = String(error?.response?.data?.message || error?.response?.data?.error || "");

  if (status === 429) return "Too many attempts. Please wait a few minutes and try again.";
  if (status === 401) return "Invalid credentials";
  if (status === 400 && message) return message;
  if (status >= 500) return "Unable to sign in right now. Please try again shortly.";
  return "Authentication failed. Please check your details and try again.";
};

export const signin = async (data: SigninPayload) => {
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