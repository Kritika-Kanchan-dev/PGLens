// src/lib/auth.tsx
// Replaces fake localStorage auth with real backend API calls

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authAPI } from "./api";

export type UserRole = "student" | "owner" | "admin";

interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  is_verified?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role: "student" | "owner") => Promise<boolean>;
  logout: () => void;
  googleLogin: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On app load — check if token exists and fetch user
  useEffect(() => {
    const token = localStorage.getItem("pglens_token");
    if (token) {
      authAPI.getMe()
        .then((data) => setUser(data.user))
        .catch(() => {
          // Token expired or invalid — clear it
          localStorage.removeItem("pglens_token");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // ─── LOGIN ──────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const data = await authAPI.login(email, password);
      localStorage.setItem("pglens_token", data.token);
      setUser(data.user);
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      throw new Error(message);
    }
  };

  // ─── REGISTER ───────────────────────────────────────────────────────────────
  const register = async (
    name: string,
    email: string,
    password: string,
    role: "student" | "owner"
  ): Promise<boolean> => {
    try {
      const data = await authAPI.register(name, email, password, role);
      localStorage.setItem("pglens_token", data.token);
      setUser(data.user);
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed";
      throw new Error(message);
    }
  };

  // ─── LOGOUT ─────────────────────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem("pglens_token");
    setUser(null);
  };

  // ─── GOOGLE LOGIN ────────────────────────────────────────────────────────────
  const googleLogin = () => {
    authAPI.googleLogin();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, googleLogin }}>
      {/* Show nothing while checking auth status on load */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

// ─── Dashboard redirect helper ───────────────────────────────────────────────
export const getDashboardPath = (role: UserRole) => {
  switch (role) {
    case "admin": return "/admin";
    case "owner": return "/owner";
    case "student": return "/dashboard";
  }
};