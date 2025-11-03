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

  const add = (product, qty = 1) => {
  const normalizedImg = normalizeImgPath(
    product.image ||
    product.img ||
    (product.images && product.images[0]) ||
    ""
  );

  setItems(prev => {
    // 🔎 cas 1 : pack personnalisé
    if (
      product.type === "pack" &&
      Array.isArray(product.components) &&
      product.components.length > 0
    ) {
      // IMPORTANT :
      // On veut que chaque pack reste une ligne distincte dans le panier.
      // Donc on NE fusionne PAS avec un item existant même si même nom.
      // On lui génère déjà un id unique dans ComposePack: `custom-pack-${Date.now()}`.
      return [
        ...prev,
        {
          // on garde l'id unique généré dans ComposePack
          id: String(product.id),

          type: "pack", // clé importante pour la suite
          name: product.name,
          price_cents: Number(product.price_cents || 0), // prix total remisé du pack
          image: normalizedImg,
          qty: Math.max(1, qty),

          // ce qui nous servira côté /checkout-session et pour le stock :
          components: product.components.map(c => ({
            id: String(c.id),
            qty: Number(c.qty || 1),
            name: c.name,
            brand: c.brand || "",
            price_cents: Number(c.price_cents || 0),
            slug: c.slug || null,
            image: normalizeImgPath(
              c.image ||
              c.img ||
              (c.images && c.images[0]) ||
              ""
            )
          })),

          meta: product.meta || {}, // { packKind, discountPct, ... }
        }
      ];
    }

    // 🔎 cas 2 : produit normal
    const i = prev.findIndex(x => String(x.id) === String(product.id) && x.type !== "pack");
    if (i >= 0) {
      // On INCRÉMENTE juste la qté si c'est un produit normal déjà présent
      const copy = [...prev];
      copy[i] = {
        ...copy[i],
        qty: copy[i].qty + qty,
      };
      if (normalizedImg && copy[i].image !== normalizedImg) copy[i].image = normalizedImg;
      if (product.slug && copy[i].slug !== product.slug) copy[i].slug = product.slug;
      return copy;
    }

    // nouveau produit normal
    return [
      ...prev,
      {
        id: String(product.id),
        type: "single",
        slug: product.slug || null,
        name: product.name,
        price_cents: Number(product.price_cents || product.priceCents || 0),
        image: normalizedImg,
        qty: Math.max(1, qty),
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
