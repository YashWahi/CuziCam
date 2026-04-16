import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

interface FetchClientOptions extends RequestInit {
  params?: Record<string, string>;
  _retry?: boolean;
}

export class APIError extends Error {
  status: number;
  data: any;
  constructor(status: number, message: string, data: any = null) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'APIError';
  }
}

async function fetchClient<T>(endpoint: string, options: FetchClientOptions = {}): Promise<T> {
  const { params, headers: customHeaders, _retry, ...customConfig } = options;

  const url = new URL(endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });
  }

  // Get token from cookies
  const token = Cookies.get('token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...customHeaders,
  };

  const config: RequestInit = {
    method: 'GET',
    ...customConfig,
    headers,
  };

  let response = await fetch(url.toString(), config);

  // Auto-refresh token on 401 Unauthorized
  if (response.status === 401 && !_retry) {
    const refreshToken = Cookies.get('refreshToken');
    
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          
          // Save new tokens
          if (data.token) Cookies.set('token', data.token);
          if (data.refreshToken) Cookies.set('refreshToken', data.refreshToken);
          
          // Retry the original request exactly once
          return fetchClient<T>(endpoint, { ...options, _retry: true });
        }
      } catch (e) {
        console.error('Token refresh failed', e);
      }
    }
    
    // If we can't refresh, clear tokens and force login
    Cookies.remove('token');
    Cookies.remove('refreshToken');
    
    if (typeof window !== 'undefined') {
      window.location.href = '/signin'; // Redirect to login on client side
    }
  }

  // Handle errors
  if (!response.ok) {
    let errorData = null;
    try {
      errorData = await response.json();
    } catch {
      // Response wasn't JSON
    }
    throw new APIError(
      response.status,
      errorData?.message || errorData?.error || 'An error occurred while fetching the data.',
      errorData
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// API Domain Exports
// ---------------------------------------------------------------------------

export const authApi = {
  login: (data: any) => fetchClient('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: any) => fetchClient('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => fetchClient('/auth/logout', { method: 'POST' }),
  getCurrentUser: () => fetchClient('/auth/me'),
  verifyEmail: (token: string) => fetchClient('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) }),
  verifyOTP: (data: { userId: string; otp: string }) => fetchClient('/auth/verify-otp', { method: 'POST', body: JSON.stringify(data) }),
  resendOtp: (data: { userId: string }) => fetchClient('/auth/resend-otp', { method: 'POST', body: JSON.stringify(data) }),
  forgotPassword: (email: string) => fetchClient('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  refreshToken: (refreshToken: string) => fetchClient('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
};

export const userApi = {
  getProfile: (id?: string) => fetchClient(id ? `/users/${id}` : '/users/profile'),
  updateProfile: (data: any) => fetchClient('/users/profile', { method: 'PUT', body: JSON.stringify(data) }),
  uploadAvatar: (formData: FormData) => fetchClient('/users/avatar', { 
    method: 'POST', 
    body: formData,
    // Let browser set the Content-Type with multipart boundaries
    headers: { 'Content-Type': undefined as any } 
  }),
  getStats: () => fetchClient('/users/me/stats'),
  getConnections: () => fetchClient('/users/me/connections'),
  completeOnboarding: (data: any) => fetchClient('/users/me/onboarding', { method: 'POST', body: JSON.stringify(data) }),
  getColleges: () => fetchClient('/colleges'),
};

export const confessionsApi = {
  getAll: (params?: { page?: number; limit?: number; sort?: string }) => fetchClient('/confessions', { params: params as Record<string, string> }),
  getById: (id: string) => fetchClient(`/confessions/${id}`),
  create: (data: { content: string; background?: string }) => fetchClient('/confessions', { method: 'POST', body: JSON.stringify(data) }),
  like: (id: string) => fetchClient(`/confessions/${id}/like`, { method: 'POST' }),
  report: (id: string, reason: string) => fetchClient(`/confessions/${id}/report`, { method: 'POST', body: JSON.stringify({ reason }) })
};

export const chaosApi = {
  join: () => fetchClient('/chaos/join', { method: 'POST' }),
  leave: () => fetchClient('/chaos/leave', { method: 'POST' }),
  getState: () => fetchClient('/chaos/state'),
  getStatus: () => fetchClient('/chaos/status'),
};

export const matchApi = {
  findMatch: (preferences?: any) => fetchClient('/matches/find', { method: 'POST', body: JSON.stringify(preferences) }),
  acceptMatch: (id: string) => fetchClient(`/matches/${id}/accept`, { method: 'POST' }),
  rejectMatch: (id: string) => fetchClient(`/matches/${id}/reject`, { method: 'POST' }),
  endMatch: (id: string) => fetchClient(`/matches/${id}/end`, { method: 'POST' }),
};

export const moderationApi = {
  report: (data: any) => fetchClient('/moderation/report', { method: 'POST', body: JSON.stringify(data) }),
};

export default fetchClient;
