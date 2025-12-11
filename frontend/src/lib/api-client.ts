import axios from "axios";
import Cookies from "js-cookie";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: Gắn token vào header
apiClient.interceptors.request.use(
  (config) => {
    if (globalThis.window !== undefined) {
      const token = Cookies.get("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor: Xử lý lỗi 401 (Unauthorized)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Nếu token hết hạn hoặc không hợp lệ, xóa token và redirect về login
      if (globalThis.window !== undefined) {
        Cookies.remove("accessToken");
        // Có thể dispatch event hoặc redirect trực tiếp
        // window.location.href = '/login'; // Cẩn thận với vòng lặp redirect
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
