import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "posto_allana_cart";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // line key = product id + variant label
  const addItem = (product, variant, qty = 1) => {
    const key = `${product.id}__${variant?.label || "default"}`;
    const price = variant ? variant.price : product.price;
    const label = variant ? variant.label : null;
    setItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) =>
          i.key === key ? { ...i, qty: i.qty + qty } : i
        );
      }
      return [
        ...prev,
        {
          key,
          id: product.id,
          name: product.name,
          variantLabel: label,
          price,
          image: product.image,
          qty,
          note: "",
        },
      ];
    });
  };

  const updateQty = (key, delta) =>
    setItems((prev) =>
      prev
        .map((i) => (i.key === key ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    );

  const setNote = (key, note) =>
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, note } : i)));

  const removeItem = (key) =>
    setItems((prev) => prev.filter((i) => i.key !== key));

  const clear = () => setItems([]);

  const total = useMemo(
    () => items.reduce((s, i) => s + i.price * i.qty, 0),
    [items]
  );
  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQty, setNote, removeItem, clear, total, count }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
