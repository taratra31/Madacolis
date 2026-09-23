import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AmazonProduct, CartItem } from "../types";

const CART_KEY = "madacolis.cart.v1";

interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  total: number;
  count: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CART_KEY);
        if (raw) setItems(JSON.parse(raw) as CartItem[]);
      } catch {
        // ignore
      }
    })();
  }, []);

  const persist = async (next: CartItem[]) => {
    setItems(next);
    await AsyncStorage.setItem(CART_KEY, JSON.stringify(next)).catch(() => {});
  };

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      addItem: (item) => {
        const next = [...items];
        const idx = next.findIndex((i) => i.productId === item.productId);
        if (idx >= 0) {
          next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity };
        } else {
          next.push(item);
        }
        void persist(next);
      },
      removeItem: (productId) => void persist(items.filter((i) => i.productId !== productId)),
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) return void persist(items.filter((i) => i.productId !== productId));
        void persist(items.map((i) => (i.productId === productId ? { ...i, quantity } : i)));
      },
      clear: () => void persist([]),
      total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      count: items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    [items],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart doit être utilisé dans CartProvider");
  return ctx;
}

export const toCartItem = (p: AmazonProduct): Omit<CartItem, "quantity"> => ({
  productId: p.asin,
  name: p.title,
  imageUrl: p.imageUrl,
  price: p.priceEUR ?? 0,
  weightKg: p.weightKg ?? 0.5,
  lengthCm: p.lengthCm ?? 20,
  widthCm: p.widthCm ?? 15,
  heightCm: p.heightCm ?? 10,
  marketplace: p.url ? "AMAZON" : "MADACOLIS",
  sourceUrl: p.url ?? null,
});