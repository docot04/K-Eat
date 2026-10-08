import React, { createContext, useContext, useState, useEffect } from "react";
import type { CartItem, MenuItem } from "../types";
import { useToast } from "./ToastContext";

interface CartContextType {
  items: CartItem[];
  cafeteriaId: number | null;
  cafeteriaName: string | null;
  addItem: (item: MenuItem, cafeName: string) => void;
  removeItem: (itemId: number) => void;
  updateQuantity: (itemId: number, qty: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CART_KEY = "keat_cart_data";

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { warning, info } = useToast();
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [cafeteriaId, setCafeteriaId] = useState<number | null>(() => {
    return items.length > 0 ? items[0].menuItem.cafeteria_id : null;
  });

  const [cafeteriaName, setCafeteriaName] = useState<string | null>(() => {
    return localStorage.getItem("keat_cart_cafe_name") || null;
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    if (items.length === 0) {
      setCafeteriaId(null);
      setCafeteriaName(null);
      localStorage.removeItem("keat_cart_cafe_name");
    } else {
      setCafeteriaId(items[0].menuItem.cafeteria_id);
    }
  }, [items]);

  const addItem = (item: MenuItem, cafeName: string) => {
    if (!item.is_available || item.stock <= 0) {
      warning(`${item.name} is currently out of stock`);
      return;
    }

    if (cafeteriaId && cafeteriaId !== item.cafeteria_id) {
      const proceed = window.confirm(
        `Your cart contains items from ${cafeteriaName}. Clear your cart to add items from ${cafeName}?`
      );
      if (!proceed) return;
      setItems([{ menuItem: item, quantity: 1 }]);
      setCafeteriaId(item.cafeteria_id);
      setCafeteriaName(cafeName);
      localStorage.setItem("keat_cart_cafe_name", cafeName);
      info(`Cart updated for ${cafeName}`);
      return;
    }

    setCafeteriaName(cafeName);
    localStorage.setItem("keat_cart_cafe_name", cafeName);

    setItems((prev) => {
      const existing = prev.find((i) => i.menuItem.item_id === item.item_id);
      if (existing) {
        if (existing.quantity >= 20) {
          warning("Maximum 20 units per item allowed in an order");
          return prev;
        }
        if (existing.quantity >= item.stock) {
          warning(`Only ${item.stock} units available in stock`);
          return prev;
        }
        return prev.map((i) =>
          i.menuItem.item_id === item.item_id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const removeItem = (itemId: number) => {
    setItems((prev) => prev.filter((i) => i.menuItem.item_id !== itemId));
  };

  const updateQuantity = (itemId: number, qty: number) => {
    if (qty <= 0) {
      removeItem(itemId);
      return;
    }
    if (qty > 20) {
      warning("Maximum 20 units per item allowed");
      return;
    }

    setItems((prev) =>
      prev.map((i) => {
        if (i.menuItem.item_id === itemId) {
          if (qty > i.menuItem.stock) {
            warning(`Only ${i.menuItem.stock} items currently in stock`);
            return { ...i, quantity: i.menuItem.stock };
          }
          return { ...i, quantity: qty };
        }
        return i;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    setCafeteriaId(null);
    setCafeteriaName(null);
    localStorage.removeItem("keat_cart_cafe_name");
  };

  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);
  const subtotal = items.reduce(
    (acc, i) => acc + i.menuItem.price * i.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        cafeteriaId,
        cafeteriaName,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
