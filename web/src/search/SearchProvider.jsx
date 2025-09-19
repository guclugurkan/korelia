// src/search/SearchProvider.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:4242";
const SearchCtx = createContext(null);
export const useSearch = () => useContext(SearchCtx);

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
function startsOrIncludes(hay, q) {
  if (!q) return false;
  const h = " " + norm(hay);
  const n = " " + norm(q);
  return h.includes(n) || h.split(/\s+/).some(w => w.startsWith(norm(q)));
}
function slugify(s) {
  return norm(s).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function SearchProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const r = await fetch(`${API}/api/products`, { headers: { Accept: "application/json" } });
        const data = await r.json();
        if (!cancelled) setProducts(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const index = useMemo(() => {
    // Catégories = types de produit + types de peau déduits
    const catSet = new Set();
    const skinSet = new Set();
    const brandSet = new Set();

    const KNOWN_SKINS = ["grasse","mixte","sèche","sensible","normale","acnéique","déshydratée","mature"];

    for (const p of products) {
      if (p.category) catSet.add(String(p.category));
      if (p.type) catSet.add(String(p.type));
      if (p.product_type) catSet.add(String(p.product_type));
      if (Array.isArray(p.tags)) {
        p.tags.forEach(t => {
          const low = String(t).toLowerCase();
          // on autorise des tags fonctionnels comme "toner", "nettoyant"
          catSet.add(String(t));
          if (KNOWN_SKINS.some(k => low.includes(k))) skinSet.add(String(t));
        });
      }
      if (Array.isArray(p.skin_types)) p.skin_types.forEach(s => skinSet.add(String(s)));
      if (p.brand) brandSet.add(String(p.brand));
    }

    const categories = Array.from(new Set([...catSet, ...skinSet])).sort((a, b) =>
      a.localeCompare(b, "fr", { sensitivity: "base" })
    );
    const brands = Array.from(brandSet).sort((a, b) =>
      a.localeCompare(b, "fr", { sensitivity: "base" })
    );

    return { categories, brands };
  }, [products]);

  function getSuggestions(query, limitPerGroup = 6) {
    const q = String(query || "").trim();
    if (!q) return { products: [], categories: [], brands: [] };

    const prod = products
      .filter(p => startsOrIncludes(`${p.name} ${p.brand || ""}`, q))
      .sort((a, b) => {
        const an = norm(a.name), bn = norm(b.name), qn = norm(q);
        const aStarts = an.startsWith(qn) ? 0 : 1;
        const bStarts = bn.startsWith(qn) ? 0 : 1;
        return aStarts - bStarts || an.localeCompare(bn, "fr");
      })
      .slice(0, limitPerGroup);

    const categories = index.categories
      .filter(c => startsOrIncludes(c, q))
      .slice(0, limitPerGroup);

    const brands = index.brands
      .filter(b => startsOrIncludes(b, q))
      .slice(0, limitPerGroup);

    return { products: prod, categories, brands };
  }

  return (
    <SearchCtx.Provider value={{ loading, products, index, getSuggestions, slugify, norm }}>
      {children}
    </SearchCtx.Provider>
  );
}
