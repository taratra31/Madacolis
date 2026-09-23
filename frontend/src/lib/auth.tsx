import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { api, clearToken, getToken, setToken } from "./api";

export type User = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: string;
  isActive: boolean;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(getToken());
  const [user, setUser] = useState<User | null>(null);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      return;
    }
    try {
      const data = await api<{ user: User }>("/auth/me");
      setUser(data.user);
    } catch {
      clearToken();
      setTokenState(null);
      setUser(null);
    }
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const data = await api<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: { identifier, password },
    });
    setToken(data.token);
    setTokenState(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      // ignoré
    }
    clearToken();
    setTokenState(null);
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, token, login, logout, refresh }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  return ctx;
}