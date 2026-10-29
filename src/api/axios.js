
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const url = config.url || "";
  const method = config.method?.toLowerCase() || "get";

  const isAdminRequest =
    url.startsWith("/api/admin/") ||
    (url.startsWith("/api/products") && method !== "get");

  const isCustomerRequest =
    url.startsWith("/api/customers/") ||
    url.startsWith("/api/cart") ||
    url.startsWith("/api/orders");

  let token = null;

  if (isAdminRequest) {
    token = sessionStorage.getItem("solace_admin_token");
  } else if (isCustomerRequest) {
    token = sessionStorage.getItem("solace_customer_token");
  }

  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestPath = new URL(error.config?.url || "", api.defaults.baseURL).pathname;
    const isLoginRequest =
      requestPath === "/api/customers/auth/login" ||
      requestPath === "/api/admin/auth/login";

    if (
      (status === 401 || status === 403) &&
      !isLoginRequest &&
      window.location.pathname !== "/"
    ) {
      window.location.replace("/");
    }

    return Promise.reject(error);
  },
);

export default api;
