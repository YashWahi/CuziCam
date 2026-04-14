'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { authApi } from '@/lib/api';
import Cookies from 'js-cookie';

export interface User {
  id: string;
  name: string;
  email: string;
  collegeId?: string;
  college?: {
    id: string;
    name: string;
    domain: string;
  };
  year?: string;
  branch?: string;
  interests?: string[];
  vibeScore?: number;
  avatarUrl?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (userData: User, token: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
  checkAuth: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('cuzicam_token') || Cookies.get('accessToken');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await authApi.getMe();
      if (response.data) {
        setUser(response.data);
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Auth verification failed', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = (userData: User, token: string, refreshToken: string) => {
    setUser(userData);
    setIsLoggedIn(true);
    localStorage.setItem('cuzicam_user', JSON.stringify(userData));
    localStorage.setItem('cuzicam_token', token);
    localStorage.setItem('cuzicam_refresh_token', refreshToken);
    
    // Cookies are mostly for the backend/httpOnly, but we sync local state too
    Cookies.set('accessToken', token, { expires: 1/24 }); // 1h
    Cookies.set('refreshToken', refreshToken, { expires: 7 }); // 7d
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('cuzicam_user');
    localStorage.removeItem('cuzicam_token');
    localStorage.removeItem('cuzicam_refresh_token');
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...data };
      setUser(updated);
      localStorage.setItem('cuzicam_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, isLoading, login, logout, updateUser, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}
