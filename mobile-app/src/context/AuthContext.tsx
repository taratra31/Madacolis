import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAuthToken } from "../api/client";
import { fetchMe, login as apiLogin, register as apiRegister } from "../api/endpoints";
import type { User } from "../types";

const TOKEN_KEY = "madacolis.auth.token";
const USER_KEY = "madacolis.auth.user";

interface AuthContextValue {
  user: User | null;
  initializing: boolean;
  login: (identifier: string, password: string, remember?: boolean) => Promise<void>;
  register: (payload: { name: string; email?: string; phone: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateUser: (u: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [token, stored] = await Promise.all([AsyncStorage.getItem(TOKEN_KEY), AsyncStorage.getItem(USER_KEY)]);
        if (token && stored) {
          setAuthToken(token);
          setUser(JSON.parse(stored) as User);
          fetchMe()
            .then((r) => {
              setUser(r.user);
              void AsyncStorage.setItem(USER_KEY, JSON.stringify(r.user));
            })
            .catch(() => {
              setAuthToken(token);
            });
        }
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  const persist = async (token: string, u: User) => {
    setAuthToken(token);
    setUser(u);
    await Promise.all([AsyncStorage.setItem(TOKEN_KEY, token), AsyncStorage.setItem(USER_KEY, JSON.stringify(u))]);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      login: async (identifier, password, remember = true) => {
        const r = await apiLogin(identifier, password);
        if (r.token && r.user) {
          setAuthToken(r.token);
          setUser(r.user);
          if (remember) {
            await Promise.all([AsyncStorage.setItem(TOKEN_KEY, r.token), AsyncStorage.setItem(USER_KEY, JSON.stringify(r.user))]);
          } else {
            await Promise.all([AsyncStorage.removeItem(TOKEN_KEY), AsyncStorage.removeItem(USER_KEY)]);
          }
        }
      },
      register: async (payload) => {
        const r = await apiRegister(payload);
        if (r.token && r.user) await persist(r.token, r.user);
      },
      logout: async () => {
        setAuthToken(null);
        setUser(null);
        await Promise.all([AsyncStorage.removeItem(TOKEN_KEY), AsyncStorage.removeItem(USER_KEY)]);
      },
      refresh: async () => {
        if (!user) return;
        const r = await fetchMe();
        setUser(r.user);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(r.user));
      },
      updateUser: async (u) => {
        setUser(u);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
      },
    }),
    [user, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return ctx;
}