import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const token = localStorage.getItem("auth_token");
  const storageKey = "local_cart_items";

  const hydrateCartItems = async (items = []) => {
    if (items.length === 0) return [];
    const serviceIds = [...new Set(items.map((i) => i.serviceId))];
    const serviceResults = await Promise.all(
      serviceIds.map((id) =>
        api.getService(id).catch(() => ({ id, title: "Service" }))
      )
    );
    const serviceById = new Map(serviceResults.map((s) => [s.id, s]));
    let options = [];
    try {
      options = await api.getServiceOptions();
    } catch {
      options = [];
    }
    const optionById = new Map(options.map((o) => [o.id, o]));

    return items.map((item) => {
      const service = serviceById.get(item.serviceId);
      const option = item.serviceOptionId
        ? optionById.get(item.serviceOptionId)
        : null;
      return {
        id: item.id,
        serviceId: item.serviceId,
        serviceOptionId: item.serviceOptionId,
        name: option?.name || service?.title || "Service",
        img: option?.imageUrl || service?.imageUrl || "",
        price: item.unitPrice,
        qty: item.quantity,
        key: `cart-${item.id}`
      };
    });
  };

  const loadServerCart = async (setState = true) => {
    const cart = await api.getCart();
    const items = await hydrateCartItems(cart?.items || []);
    if (setState) setCartItems(items);
    return items;
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (token) {
        try {
          const items = await loadServerCart(false);
          if (!mounted) return;
          setCartItems(items);
          return;
        } catch {
          // fall back to local
        }
      }
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
        if (!mounted) return;
        setCartItems(saved);
      } catch {
        // ignore
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [token]);

  useEffect(() => {
    if (!token) {
      localStorage.setItem(storageKey, JSON.stringify(cartItems));
    }
  }, [cartItems, token]);

  const addToCart = (item) => {
    const key = item.key || item.name;
    if (token && item.serviceId) {
      api
        .addCartItem({
          serviceId: item.serviceId,
          serviceOptionId: item.serviceOptionId,
          unitPrice: item.price,
          quantity: 1
        })
        .then(() => loadServerCart())
        .catch(() => {});
      return;
    }
    setCartItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) =>
          i.key === key ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { ...item, key, qty: 1 }];
    });
  };

  const removeFromCart = (key) => {
    const item = cartItems.find((i) => i.key === key);
    if (token && item?.id) {
      api
        .deleteCartItem(item.id)
        .then(() => loadServerCart())
        .catch(() => {});
    }
    setCartItems((prev) => prev.filter((i) => i.key !== key));
  };

  const updateQty = (key, delta) => {
    setCartItems((prev) => {
      const next = prev
        .map((i) =>
          i.key === key ? { ...i, qty: Math.max(0, i.qty + delta) } : i
        )
        .filter((i) => i.qty > 0);
      const item = next.find((i) => i.key === key);
      if (token && item?.id) {
        api
          .updateCartItem(item.id, { quantity: item.qty })
          .then(() => loadServerCart())
          .catch(() => {});
      }
      return next;
    });
  };

  const setQty = (key, qty) => {
    const nextQty = Number.isFinite(qty) ? Math.max(0, qty) : 0;
    setCartItems((prev) => {
      const next = prev
        .map((i) => (i.key === key ? { ...i, qty: nextQty } : i))
        .filter((i) => i.qty > 0);
      const item = next.find((i) => i.key === key);
      if (token && item?.id) {
        api
          .updateCartItem(item.id, { quantity: item.qty })
          .then(() => loadServerCart())
          .catch(() => {});
      }
      return next;
    });
  };

  const clearCart = () => {
    if (token) {
      api
        .clearCart()
        .then(() => loadServerCart())
        .catch(() => {});
    }
    setCartItems([]);
    if (!token) localStorage.removeItem(storageKey);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQty,
        setQty,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext)
