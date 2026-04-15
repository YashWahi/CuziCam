"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import { authApi } from "@/lib/api";

type User = {
  id: string;
  email: string;
  name: string;
  isVerified: boolean;
  isEmailVerified: boolean;
  vibeScore: number;
  college: { id: string; name: string; domain: string };
  interests: string;
  year?: string;
  branch?: string;
  bio?: string;
  avatarUrl?: string;
  badges?: string;
  strictPreference: boolean;
};

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (token: string, refreshToken?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = Cookies.get("token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await authApi.getCurrentUser();
        // Set user to userData or its inner user object based on API response structure
        setUser(userData?.user || userData);
        setIsLoggedIn(true);
      } catch (error) {
        setIsLoggedIn(false);
        Cookies.remove("token");
        Cookies.remove("refreshToken");
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (token: string, refreshToken?: string) => {
    Cookies.set("token", token);
    if (refreshToken) {
      Cookies.set("refreshToken", refreshToken);
    }
    try {
      const userData = await authApi.getCurrentUser();
      setUser(userData?.user || userData);
      setIsLoggedIn(true);
    } catch (error) {
      console.error("Failed to fetch user during login", error);
      setIsLoggedIn(false);
    }
  };

  const logout = () => {
    Cookies.remove("token");
    Cookies.remove("refreshToken");
    setUser(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
