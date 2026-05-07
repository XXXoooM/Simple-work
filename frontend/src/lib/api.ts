import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8787',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Token 刷新状态（避免并发刷新）
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

// 请求拦截器：自动附加 JWT
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：处理 401 + 自动 Token 续签
api.interceptors.response.use(
  (response) => response,
  async (err) => {
    const originalRequest = err.config;

    // 401 且不是 login/refresh 请求本身 → 尝试刷新 token
    if (
      err.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/api/auth/login') &&
      !originalRequest.url?.includes('/api/auth/refresh')
    ) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        const currentToken = useAuthStore.getState().token;

        if (!currentToken) {
          useAuthStore.getState().logout();
          window.location.href = '/login';
          return Promise.reject(err);
        }

        try {
          const res = await axios.post(
            `${api.defaults.baseURL}/api/auth/refresh`,
            {},
            { headers: { Authorization: `Bearer ${currentToken}` } },
          );
          const { token, userInfo } = res.data.data;
          useAuthStore.getState().setAuth(token, userInfo);
          isRefreshing = false;
          onTokenRefreshed(token);

          // 用新 token 重试原始请求
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch {
          isRefreshing = false;
          refreshSubscribers = [];
          useAuthStore.getState().logout();
          window.location.href = '/login';
          return Promise.reject(err);
        }
      } else {
        // 正在刷新中，排队等待
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        });
      }
    }

    // 其他 401（login 本身）或非 401 错误直接抛出
    return Promise.reject(err);
  },
);

export default api;
