// src/favorites/FavoritesContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const FavoritesCtx = createContext(undefined);

// Hook
export function useFavorites() {
  const ctx = useContext(FavoritesCtx);
  if (!ctx) {
    // On renvoie un stub “sûr” pour éviter les crashes si pas de Provider
    return {
      favorites: [],
      has: () => false,
      add: () => {},
      remove: () => {},
      toggle: () => {},
      clear: () => {},
    };
  }
  return ctx;
}

const STORAGE_KEY = "favorites_v1";

// Normalise un produit pour stockage
function normalizeProduct(p) {
  if (!p) return null;
  return {
    id: String(p.id),
    slug: p.slug || null,
    name: p.name || "",
    brand: p.brand || "",
    image: p.image || p.images?.[0] || "",
    price_cents: Number(p.price_cents || p.priceCents || 0),
  };
}

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const arr = JSON.parse(raw || "[]");
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {}
  }, [favorites]);

  const has = (id) => favorites.some((f) => String(f.id) === String(id));

  const add = (p) => {
    const n = normalizeProduct(p);
    if (!n) return;
    setFavorites((prev) => (prev.some((f) => f.id === n.id) ? prev : [n, ...prev]));
  };

  const remove = (id) => {
    setFavorites((prev) => prev.filter((f) => String(f.id) !== String(id)));
  };

  const toggle = (pOrId) => {
    const id = typeof pOrId === "object" ? String(pOrId.id) : String(pOrId);
    if (!id) return;
    setFavorites((prev) => {
      const exists = prev.some((f) => f.id === id);
      if (exists) return prev.filter((f) => f.id !== id);
      const n = typeof pOrId === "object" ? normalizeProduct(pOrId) : null;
      return n ? [n, ...prev] : prev;
    });
  };

  const clear = () => setFavorites([]);

  const value = useMemo(() => ({ favorites, has, add, remove, toggle, clear }), [favorites]);

  return <FavoritesCtx.Provider value={value}>{children}</FavoritesCtx.Provider>;
}

// 👇 Pour compat avec tes imports actuels (default)
export default FavoritesProvider;
