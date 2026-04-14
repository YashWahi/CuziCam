import axios, { AxiosError } from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Crucial for httpOnly cookies
});

// Request Interceptor to attach accessToken if it's in localStorage/Cookies 
// (Though with withCredentials: true, browser handles httpOnly cookies automatically)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cuzicam_token') || Cookies.get('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor for handling token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('cuzicam_refresh_token') || Cookies.get('refreshToken');
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken }, { withCredentials: true });
        
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        // Update storage
        localStorage.setItem('cuzicam_token', accessToken);
        localStorage.setItem('cuzicam_refresh_token', newRefreshToken);
        
        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear everything and redirect to login
        localStorage.removeItem('cuzicam_token');
        localStorage.removeItem('cuzicam_refresh_token');
        localStorage.removeItem('cuzicam_user');
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        
        if (typeof window !== 'undefined') {
          window.location.href = '/signin';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  verifyOTP: (data: { userId: string; otp: string }) => api.post('/auth/verify-otp', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  getMe: () => api.get('/auth/me'),
  getColleges: () => api.get('/auth/colleges'),
};

export const userApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
  getConnections: () => api.get('/users/connections'),
  getLeaderboard: () => api.get('/users/leaderboard'),
  onboarding: (data: any) => api.post('/users/me/onboarding', data), // Placeholder if added to users route
};

export const chaosApi = {
  getStatus: () => api.get('/chaos/status'),
};

export const confessionApi = {
  getAll: (collegeId: string, sort = 'trending', page = 1) => 
    api.get(`/confessions?collegeId=${collegeId}&sort=${sort}&page=${page}`),
  create: (data: { content: string; category: string; collegeId: string }) => 
    api.post('/confessions', data),
  vote: (id: string) => api.post(`/confessions/${id}/vote`),
};

export default api;
