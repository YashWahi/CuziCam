'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  college: string;
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
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('cuzicam_user');
    const token = localStorage.getItem('cuzicam_token');
    if (stored && token) {
      try {
        setUser(JSON.parse(stored));
        setIsLoggedIn(true);
      } catch {
        localStorage.removeItem('cuzicam_user');
        localStorage.removeItem('cuzicam_token');
      }
    }
  }, []);

  const login = (userData: User, token: string) => {
    setUser(userData);
    setIsLoggedIn(true);
    localStorage.setItem('cuzicam_user', JSON.stringify(userData));
    localStorage.setItem('cuzicam_token', token);
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('cuzicam_user');
    localStorage.removeItem('cuzicam_token');
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...data };
      setUser(updated);
      localStorage.setItem('cuzicam_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
