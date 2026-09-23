import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { api, TOKEN_KEY, unauthorizedHandler } from "@/services/api";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (identifier: string, password: string, remember?: boolean) => Promise<User>;
  register: (payload: {
    name: string;
    email?: string;
    phone: string;
    password: string;
    country?: string;
    city?: string;
  }) => Promise<User>;
  logout: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [user, setUserState] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState<boolean>(Boolean(localStorage.getItem(TOKEN_KEY)));

  const setUser = useCallback((u: User) => setUserState(u), []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let active = true;
    api<{ user: User }>("/auth/me")
      .then((data) => {
        if (active) setUserState(data.user);
      })
      .catch(() => {
        if (active) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUserState(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  useEffect(
    () =>
      unauthorizedHandler(() => {
        setToken(null);
        setUserState(null);
        navigate("/login", { replace: true });
      }),
    [navigate],
  );

  const login = useCallback(async (identifier: string, password: string, remember = true) => {
    const data = await api<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: { identifier, password },
    });
    if (remember) localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUserState(data.user);
    return data.user;
  }, []);

  const register = useCallback(
    async (payload: { name: string; email?: string; phone: string; password: string; country?: string; city?: string }) => {
      const data = await api<{ token: string; user: User }>("/auth/register", { method: "POST", body: payload });
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setUserState(data.user);
      return data.user;
    },
    [],
  );

  const logout = useCallback(() => {
    void api<{ message: string }>("/auth/logout", { method: "POST" }).catch(() => undefined);
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUserState(null);
    navigate("/", { replace: true });
  }, [navigate]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, loading, login, register, logout, setUser }),
    [user, token, loading, login, register, logout, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  return ctx;
}