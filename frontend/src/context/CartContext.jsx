import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getCart } from "../api/cart";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

/**
 * Tracks the logged-in user's cart item count so the navbar can show a live
 * badge. It refreshes on mount, whenever the user changes, and whenever any
 * component dispatches `window` event "kb:cart-changed" after mutating the
 * cart (same pattern the compare / recently-viewed stores already use).
 */
export function CartProvider({ children }) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    if (!user) {
      setCount(0);
      return;
    }
    getCart()
      .then((res) => {
        const items = res.data?.items || [];
        setCount(items.reduce((n, it) => n + (it.quantity || 0), 0));
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onChange = () => refresh();
    window.addEventListener("kb:cart-changed", onChange);
    return () => window.removeEventListener("kb:cart-changed", onChange);
  }, [refresh]);

  return (
    <CartContext.Provider value={{ count, refresh }}>
      {children}
    </CartContext.Provider>
  );
}

// Fire this after any successful cart mutation.
// eslint-disable-next-line react-refresh/only-export-components
export function notifyCartChanged() {
  window.dispatchEvent(new Event("kb:cart-changed"));
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  return useContext(CartContext) || { count: 0, refresh: () => {} };
}
