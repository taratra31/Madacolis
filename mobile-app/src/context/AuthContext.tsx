import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getMe, login as apiLogin, register as apiRegister } from "../api/endpoints";
import { loadStoredToken, setAuthToken, setUnauthorizedHandler, TOKEN_KEY, USER_KEY } from "../api/client";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  ready: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (payload: { name: string; email: string; phone: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await loadStoredToken();
      if (stored) {
        setAuthToken(stored);
        setToken(stored);
        try {
          const me = await getMe();
          setUser(me.user);
        } catch {
          await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
          setAuthToken(null);
          setToken(null);
          setUser(null);
        }
      }
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setToken(null);
      void AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const applySession = async (newToken: string, newUser: User) => {
    setAuthToken(newToken);
    await AsyncStorage.setItem(TOKEN_KEY, newToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const login = useCallback(async (identifier: string, password: string) => {
    const res = await apiLogin(identifier, password);
    await applySession(res.token, res.user);
  }, []);

  const register = useCallback(async (payload: { name: string; email: string; phone: string; password: string }) => {
    const res = await apiRegister(payload);
    await applySession(res.token, res.user);
  }, []);

  const logout = useCallback(async () => {
    setAuthToken(null);
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, ready, login, register, logout }),
    [user, token, ready, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}