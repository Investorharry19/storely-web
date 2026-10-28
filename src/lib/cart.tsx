"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  itemId: string;
  itemType: "product" | "service";
  businessSlug: string;
  businessName: string;
  name: string;
  price: number;
  quantity: number;
  stockQuantity: number;
  imageUrl?: string;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  total: number;
  addItem: (item: CartItem) => boolean;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const CART_KEY = "storely.cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hydrate = () => {
      try {
        const stored = window.localStorage.getItem(CART_KEY);
        if (stored) setItems(JSON.parse(stored) as CartItem[]);
      } catch {
        window.localStorage.removeItem(CART_KEY);
      } finally {
        setReady(true);
      }
    };
    queueMicrotask(hydrate);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items, ready]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      addItem: (item) => {
        if (items[0] && items[0].businessSlug !== item.businessSlug)
          return false;
        setItems((current) => {
          const existing = current.find(
            (entry) => entry.itemId === item.itemId,
          );
          if (!existing) return [...current, item];
          return current.map((entry) =>
            entry.itemId === item.itemId
              ? {
                  ...entry,
                  quantity: Math.min(
                    entry.quantity + item.quantity,
                    entry.stockQuantity,
                  ),
                }
              : entry,
          );
        });
        return true;
      },
      updateQuantity: (itemId, quantity) =>
        setItems((current) =>
          current.map((item) =>
            item.itemId === itemId
              ? {
                  ...item,
                  quantity: Math.max(1, Math.min(quantity, item.stockQuantity)),
                }
              : item,
          ),
        ),
      removeItem: (itemId) =>
        setItems((current) => current.filter((item) => item.itemId !== itemId)),
      clear: () => {
        setItems([]);
        window.localStorage.removeItem(CART_KEY);
      },
    }),
    [items],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
