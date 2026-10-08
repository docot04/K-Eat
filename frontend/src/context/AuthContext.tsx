import React, { createContext, useContext, useState, useEffect } from "react";
import type { User, UserRole } from "../types";
import {
  api,
  getStoredToken,
  getStoredUser,
  isDemoMode,
  removeStoredToken,
  removeStoredUser,
  setDemoMode,
  setStoredToken,
  setStoredUser,
} from "../services/api";
import { MOCK_USERS } from "../services/mockData";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  demoMode: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: "student" | "staff";
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  switchDemoRole: (role: UserRole) => void;
  toggleDemoMode: () => void;
  isStudent: boolean;
  isStaff: boolean;
  isCafeStaff: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [demoMode, setDemoModeState] = useState<boolean>(isDemoMode());

  useEffect(() => {
    const initAuth = async () => {
      const stored = getStoredUser();
      const token = getStoredToken();
      if (token && stored) {
        setUser(stored);
        try {
          const fresh = await api.getMe();
          setUser(fresh);
        } catch {
          // keep stored
        }
      } else {
        // Default to student demo user if nothing stored to make testing instant
        const defaultUser = MOCK_USERS[0];
        setUser(defaultUser);
        setStoredUser(defaultUser);
        setStoredToken("demo-token-1");
        setDemoMode(true);
        setDemoModeState(true);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    setUser(res.user);
  };

  const signup = async (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: "student" | "staff";
  }) => {
    const res = await api.signup(data);
    setUser(res.user);
  };

  const logout = () => {
    removeStoredToken();
    removeStoredUser();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const u = await api.getMe();
      setUser(u);
    } catch {
      // ignore
    }
  };

  const switchDemoRole = (role: UserRole) => {
    const found = MOCK_USERS.find((u) => u.role === role) || MOCK_USERS[0];
    setUser(found);
    setStoredUser(found);
    setStoredToken("mock-jwt-token-" + found.id);
    setDemoMode(true);
    setDemoModeState(true);
  };

  const toggleDemoMode = () => {
    const next = !demoMode;
    setDemoMode(next);
    setDemoModeState(next);
  };

  const isStudent = user?.role === "student";
  const isStaff = user?.role === "staff";
  const isCafeStaff = user?.role === "cafe_staff";
  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        demoMode,
        login,
        signup,
        logout,
        refreshUser,
        switchDemoRole,
        toggleDemoMode,
        isStudent,
        isStaff,
        isCafeStaff,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
