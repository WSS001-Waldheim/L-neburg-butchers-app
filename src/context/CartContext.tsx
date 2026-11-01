import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getProduct } from '../data/seed';
import type { CartItem } from '../data/types';
import { getStockStatus } from '../data/types';

type CartContextValue = {
  items: CartItem[],
  addItem: (productId: string, qty?: number) => { ok: boolean; reason?: string };
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  totalCents: number,
  itemCount: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = 'luneburg.cart.v1';

function loadCart(): CartItem[] {
  try {
    if (typeof sessionStorage === 'undefined') return [];
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  useEffect(() => {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      }
    } catch {
      /* ignore */
    }
  }, [items]);

  const addItem = useCallback((productId: string, qty = 1) => {
    const product = getProduct(productId);
    if (!product) return { ok: false, reason: 'Product not found' };
    if (getStockStatus(product) === 'out_of_stock') {
      return { ok: false, reason: 'Not available yet' };
    }
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      const nextQty = (existing?.quantity ?? 0) + qty;
      if (nextQty > product.stockLevel) return prev;
      if (existing) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, quantity: nextQty } : i
        );
      }
      return [...prev, { productId, quantity: qty }];
    });
    return { ok: true };
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.productId !== productId);
      const product = getProduct(productId);
      const capped = product
        ? Math.min(quantity, Math.max(product.stockLevel, 0))
        : quantity;
      return prev.map((i) =>
        i.productId === productId ? { ...i, quantity: capped } : i
      );
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const totalCents = useMemo(
    () =>
      items.reduce((sum, item) => {
        const p = getProduct(item.productId);
        return sum + (p?.priceCents ?? 0) * item.quantity;
      }, 0),
    [items]
  );

  const itemCount = useMemo(
    () => items.reduce((n, i) => n + i.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      addItem,
      setQuantity,
      removeItem,
      clear,
      totalCents,
      itemCount,
    }),
    [items, addItem, setQuantity, removeItem, clear, totalCents, itemCount]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
