import axios from 'axios';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
export const BASE_URL = API_URL.replace('/api', '');

export function getImageUrl(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Initialize refresh-token state used by interceptors
(api as any)._isRefreshing = false;
(api as any)._failedQueue = [] as Array<{ resolve: (token: string) => void; reject: (err: any) => void }>;

// Request interceptor: attach JWT token
api.interceptors.request.use(
  async (config) => {
    if (typeof window !== 'undefined') {
      let token = localStorage.getItem('gastroflow_token');
      // If we don't have an access token but have a stored refresh token, try refreshing proactively
      if (!token) {
        const storedRefresh = localStorage.getItem('gastroflow_refresh_token');
        if (storedRefresh && !(api as any)._isRefreshing) {
          try {
            (api as any)._isRefreshing = true;
            const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken: storedRefresh }, { withCredentials: true });
            const newToken = res.data.data?.token || res.data.token || (res.data && res.data.data && res.data.data.token);
            if (newToken) {
              localStorage.setItem('gastroflow_token', newToken);
              token = newToken;
              api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
            }
          } catch (err) {
            // refresh failed; clear stored auth so subsequent logic can handle it
            localStorage.removeItem('gastroflow_token');
            localStorage.removeItem('gastroflow_user');
          } finally {
            (api as any)._isRefreshing = false;
          }
        }
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      config.headers['Pragma'] = 'no-cache';
      config.headers['Expires'] = '0';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle auth errors without forcing an immediate route jump
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest?._retry) {
      // try to refresh token
      originalRequest._retry = true;

      if (typeof window === 'undefined') return Promise.reject(error);

      if ((api as any)._isRefreshing) {
        // queue request until token refreshed
        return new Promise<string>((resolve, reject) => {
          (api as any)._failedQueue.push({ resolve, reject });
        })
          .then((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      (api as any)._isRefreshing = true;
      (api as any)._failedQueue = [];

      return new Promise((resolve, reject) => {
        // Try refresh via cookie first; if not available (dev), send stored refresh token
        const storedRefresh = typeof window !== 'undefined' ? localStorage.getItem('gastroflow_refresh_token') : null;
        const body = storedRefresh ? { refreshToken: storedRefresh } : null;
        axios
          .post(`${API_URL}/auth/refresh`, body, { withCredentials: true })
          .then((res) => {
            const newToken = res.data.data?.token || res.data.token || (res.data && res.data.data && res.data.data.token);
            if (!newToken) throw new Error('No token from refresh');
            localStorage.setItem('gastroflow_token', newToken);
            api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
            originalRequest.headers.Authorization = `Bearer ${newToken}`;

            (api as any)._failedQueue.forEach((p: any) => p.resolve(newToken));
            (api as any)._failedQueue = [];
            resolve(api(originalRequest));
          })
          .catch((err) => {
            (api as any)._failedQueue.forEach((p: any) => p.reject(err));
            (api as any)._failedQueue = [];
            // Clear stored auth on refresh failure
            localStorage.removeItem('gastroflow_token');
            localStorage.removeItem('gastroflow_user');
            reject(err);
          })
          .finally(() => {
            (api as any)._isRefreshing = false;
          });
      });
    }

    return Promise.reject(error);
  }
);

export default api;
