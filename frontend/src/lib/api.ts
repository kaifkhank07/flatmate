import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api`;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Avoid infinite refresh loops on auth endpoints where 401 is an expected failure
const AUTH_ENDPOINTS_TO_SKIP_REFRESH = [
  '/users/login',
  '/users/register',
  '/users/refresh-token',
  '/auth/mobile/login',
  '/auth/mobile/register',
  '/auth/mobile/register/verify-otp',
  '/auth/mobile/send-otp',
  '/auth/mobile/verify-otp',
  '/auth/mobile/refresh-token',
  '/auth/mobile/logout',
  '/users/logout',
  '/otp/send',
  '/otp/verify',
];

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Shared promise for multiple concurrent 401 requests
let refreshPromise: Promise<any> | null = null;

// Response Interceptor: Format error messages & handle automatic token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url || '';

    const isAuthEndpoint = AUTH_ENDPOINTS_TO_SKIP_REFRESH.some((endpoint) =>
      requestUrl.includes(endpoint)
    );

    // If 401 received on a protected request and we haven't retried yet
    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          // Direct axios call to refresh-token without using the interceptor instance to prevent loops
          refreshPromise = axios
            .post(
              `${API_BASE_URL}/users/refresh-token`,
              {},
              { withCredentials: true }
            )
            .finally(() => {
              refreshPromise = null;
            });
        }

        await refreshPromise;
        // Cookie was renewed by backend, retry original request
        return apiClient(originalRequest);
      } catch (refreshErr) {
        // If refresh fails, reset frontend auth state
        if (typeof window !== 'undefined') {
          try {
            const { useAuthStore } = await import('@/store/useAuthStore');
            useAuthStore.getState().resetAuth();
          } catch {
            // ignore
          }
        }
        const message =
          error.response?.data?.message ||
          error.message ||
          'Session expired. Please log in again.';
        return Promise.reject(new Error(message));
      }
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
