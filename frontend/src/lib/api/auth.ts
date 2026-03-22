import API from "./api";

type SigninResponse = {
  token: string;
};

export const signin = async (data: any) => {
  const res = await API.post<SigninResponse>("/auth/signin", data);

  localStorage.setItem("token", res.data.token);

  return res;
};