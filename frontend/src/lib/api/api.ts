import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true
});

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    const status = error?.response?.status;
    const requestUrl = originalRequest?.url || "";

    const isAuthEndpoint =
      requestUrl.includes("/auth/signin") ||
      requestUrl.includes("/auth/refresh") ||
      requestUrl.includes("/auth/logout");

    const retryableRequest = originalRequest as any;

    if (status === 401 && !isAuthEndpoint && retryableRequest && !retryableRequest._retry) {
      retryableRequest._retry = true;

      try {
        await API.post("/auth/refresh");
        return API(retryableRequest);
      } catch {
        if (window.location.pathname !== "/login") {
          window.location.href = "/login?session=expired";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default API;