import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react";

export interface CartProduct {
  productId: string;
  name: string;
  imageUrl: string | null;
  price: number;
  quantity: number;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  marketplace: "AMAZON" | "ALIBABA" | "ALIEXPRESS" | "UNKNOWN";
  sourceUrl: string;
}

interface CartItem extends CartProduct {
  id: string;
}

type CartAction =
  | { type: "ADD_ITEM"; payload: CartProduct }
  | { type: "REMOVE_ITEM"; payload: { id: string } }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "LOAD"; payload: CartItem[] };

interface CartState {
  items: CartItem[];
}

interface CartContextValue extends CartState {
  addItem: (item: CartProduct) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  totalWeight: number;
}

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find(
        (i) => i.productId === action.payload.productId && i.sourceUrl === action.payload.sourceUrl,
      );
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === existing.id ? { ...i, quantity: i.quantity + action.payload.quantity } : i,
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.payload, id: crypto.randomUUID() }] };
    }
    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter((i) => i.id !== action.payload.id) };
    case "UPDATE_QUANTITY":
      if (action.payload.quantity <= 0)
        return { ...state, items: state.items.filter((i) => i.id !== action.payload.id) };
      return {
        ...state,
        items: state.items.map((i) => (i.id === action.payload.id ? { ...i, quantity: action.payload.quantity } : i)),
      };
    case "CLEAR_CART":
      return { ...state, items: [] };
    case "LOAD":
      return { ...state, items: action.payload };
    default:
      return state;
  }
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "madacolis_cart";

function loadInitial(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [] }, () => ({ items: loadInitial() }));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
  }, [state.items]);

  const addItem = (item: CartProduct) => dispatch({ type: "ADD_ITEM", payload: item });
  const removeItem = (id: string) => dispatch({ type: "REMOVE_ITEM", payload: { id } });
  const updateQuantity = (id: string, quantity: number) => dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity } });
  const clearCart = () => dispatch({ type: "CLEAR_CART" });

  const totalItems = state.items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = state.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalWeight = state.items.reduce((s, i) => s + i.weightKg * i.quantity, 0);

  return (
    <CartContext.Provider value={{ ...state, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice, totalWeight }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}