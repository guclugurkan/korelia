// src/cart/CartContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartCtx = createContext(null);
export const useCart = () => useContext(CartCtx);

// Normalise les chemins d’image vers un chemin exploitable par Vite/public
function normalizeImgPath(p) {
  if (!p) return null;
  if (/^https?:\/\//i.test(p)) return p; // URL absolue OK
  if (p.startsWith("/")) return p;       // déjà absolu OK
  // sinon -> enlève ../ ou ./ et préfixe /
  return "/" + String(p).replace(/^(\.\/|\.\.\/)+/, "");
}

export function CartProvider({children}){
  const [items, setItems] = useState(()=> {
    try { return JSON.parse(localStorage.getItem("cart")||"[]"); }
    catch { return []; }
  });

  useEffect(()=>{ localStorage.setItem("cart", JSON.stringify(items)); }, [items]);

  const add = (product, qty=1) => {
    const normalizedImg = normalizeImgPath(product.image || product.img || product.images?.[0] || "");
    setItems(prev=>{
      const i = prev.findIndex(x => String(x.id) === String(product.id));
      if(i>=0){
        const copy=[...prev];
        copy[i]={...copy[i], qty: copy[i].qty + qty};
        // si on récupère une image plus “propre” on met à jour
        if (normalizedImg && copy[i].image !== normalizedImg) copy[i].image = normalizedImg;
        // on conserve un slug si dispo
        if (product.slug && copy[i].slug !== product.slug) copy[i].slug = product.slug;
        return copy;
      }
      return [
        ...prev,
        {
          id: String(product.id),
          slug: product.slug || null,
          name: product.name,
          price_cents: Number(product.price_cents || product.priceCents || 0),
          image: normalizedImg,
          qty: Math.max(1, qty)
        }
      ];
    });
  };

  const remove = (id) => setItems(prev=>prev.filter(x=>x.id!==id));
  const setQty = (id, qty) => setItems(prev=>prev.map(x=>x.id===id?{...x, qty: Math.max(1, qty)}:x));
  const clear = () => setItems([]);

  const total_cents = useMemo(()=> items.reduce((s,x)=> s + Number(x.price_cents||0)*Number(x.qty||1), 0), [items]);

  return (
    <CartCtx.Provider value={{items, add, remove, setQty, clear, total_cents}}>
      {children}
    </CartCtx.Provider>
  );
}
