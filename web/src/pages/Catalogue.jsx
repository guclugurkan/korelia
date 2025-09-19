// src/pages/Catalogue.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import HeaderAll from "../components/HeaderAll";
import Footer from "../components/Footer";
import "./Catalogue.css";
import "./../components/BestSellers.css"; // <-- réutilise le CSS .thumb .img.primary/.secondary
import FavoriteButton from "../components/FavoriteButton";

// --- Héros de marque
const BRAND_HERO = {
  "ANUA":             "/img/hero/brands/anua-hero.jpg",
  "Beauty of Joseon": "/img/hero/brands/beauty-of-joseon-hero.jpg",
  "Biodance":         "/img/hero/brands/biodance-hero.jpg",
  "COSRX":            "/img/hero/brands/cosrx-hero.jpg",
  "Dr Althea":        "/img/hero/brands/dr-althea-hero.jpg",
  "Haruharu Wonder":  "/img/hero/brands/haruharu-wonder-hero.jpg",
  "I'm From":         "/img/hero/brands/im-from-hero.jpg",
  "iUNIK":            "/img/hero/brands/iunik-hero.jpg",
  "Laneige":          "/img/hero/brands/laneige-hero.jpg",
  "Medicube":         "/img/hero/brands/medicube-hero.jpg",
  "Mixsoon":          "/img/hero/brands/mixsoon-hero.jpg",
  "Round Lab":        "/img/hero/brands/round-lab-hero.jpg",
  "SKIN1004":         "/img/hero/brands/skin1004-hero.jpg",
  "Some By Mi":       "/img/hero/brands/some-by-mi-hero.jpg",
  "Torriden":         "/img/hero/brands/torriden-hero.jpg",
};
const GLOBAL_HERO = "/img/hero/all-brands-hero.jpg";

// Image héros pour la catégorie "pack"
const CATEGORY_HERO = {
  pack: "/img/hero/categories/pack-hero.jpg",
};

function BrandHero({ brand, category }) {
  const catKey = String(category || "").toLowerCase();
  const catSrc = CATEGORY_HERO[catKey];
  const brandSrc = brand && BRAND_HERO[brand] ? BRAND_HERO[brand] : null;
  const src = catSrc || brandSrc || GLOBAL_HERO;

  const label = category ? String(category) : (brand ? brand : "Toutes les marques");
  const badge = category ? "Pack" : (brand ? "Marque" : "Catalogue");
  const title = category ? `Nos ${String(category)}s` : (brand || "Découvre nos produits");

  return (
    <section className="cat-hero" role="img" aria-label={label}>
      <img src={src} alt="" onError={(e)=>{ e.currentTarget.style.display="none"; }} />
      <div className="cat-hero-overlay" />
      <div className="cat-hero-inner">
        <div className="cat-hero-badge">{badge}</div>
        <h1 className="cat-hero-title">{title}</h1>
        {!brand && !category && (
          <p className="cat-hero-sub">Skincare coréenne — sélection de marques reconnues</p>
        )}
      </div>
    </section>
  );
}

// --- Utils
const API = import.meta.env.VITE_API_URL || "http://localhost:4242";
const fmtEur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const PAGE_SIZE_DEFAULT = 12;

const fallbackImg =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='500'>
      <rect width='100%' height='100%' fill='#f3f4f6'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#9ca3af' font-family='system-ui,Segoe UI,Roboto,Arial' font-size='14'>
        Image indisponible
      </text>
    </svg>`
  );

/** Respecte BASE_URL (prod sous sous-chemin) pour tes assets du dossier public/ */
function publicAsset(p) {
  if (!p) return null;
  if (/^https?:\/\//i.test(p)) return p;
  const base = import.meta.env.BASE_URL || "/";
  const rel = String(p).replace(/^(\.\/|\.\.\/)+/, "").replace(/^\/+/, "");
  return (base.endsWith("/") ? base : base + "/") + rel;
}

/** Construit [primary, hover] en priorisant images[] puis repli sur image */
function collectImages(entity, max = 2) {
  const out = [];
  if (Array.isArray(entity?.images)) out.push(...entity.images);
  if (entity?.image) out.push(entity.image);
  const uniq = Array.from(new Set(out.filter(Boolean).map(publicAsset)));
  return (uniq.length ? uniq : [fallbackImg]).slice(0, max);
}

// pour classes CSS stables
function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// normalise pour recherche (enlève accents + toLowerCase)
function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export default function Catalogue() {
  const location = useLocation();

  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  // Filtres / UI
  const [search, setSearch] = useState("");
  const [brandSel, setBrandSel] = useState(new Set());
  const [skinSel, setSkinSel] = useState(new Set());
  const [catSel, setCatSel] = useState(new Set());
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(0);
  const [sort, setSort] = useState("reco");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);

  // Mobile overlay
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Charge les produits + ENRICHIT (pour avoir au moins 2 images)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setErr("");
        setLoading(true);
        const r = await fetch(`${API}/api/products`, { headers: { Accept: "application/json" } });
        if (!r.ok) throw new Error("API produits indisponible");
        const data = await r.json();
        if (cancelled) return;

        const arr = Array.isArray(data) ? data : [];

        // Enrichissement: pour ceux qui n'ont pas encore 2 images, on va chercher les détails
        const enriched = await Promise.all(
          arr.map(async (p) => {
            const hasTwo = Array.isArray(p.images) && p.images.length >= 2;
            if (hasTwo) return p;
            try {
              const key = String(p.slug || p.id);
              const r2 = await fetch(`${API}/api/products/${key}`);
              if (!r2.ok) return p;
              const full = await r2.json();
              const images = Array.isArray(full.images) ? full.images : p.images;
              const image = full.image ?? p.image;
              return { ...p, images, image };
            } catch {
              return p;
            }
          })
        );

        setItems(enriched);

        // bornes prix initiales à partir de la liste enrichie
        const prices = enriched.map((p) => Number(p.price_cents || 0) / 100);
        const min = prices.length ? Math.floor(Math.min(...prices)) : 0;
        const max = prices.length ? Math.ceil(Math.max(...prices)) : 0;
        setPriceMin(min);
        setPriceMax(max);
      } catch (e) {
        if (!cancelled) setErr(e.message || "Erreur de chargement");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Facettes
  const facets = useMemo(() => {
    const brands = Array.from(new Set(items.map((p) => p.brand).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));

    const KNOWN_SKINS = ["grasse","mixte","sèche","sensible","normale","acnéique","déshydratée","mature","terne","pores-visibles","anti-âge","anti-taches","abîmée","réactive","tous"];
    const skinSet = new Set();
    for (const p of items) {
      if (Array.isArray(p.skin_types)) p.skin_types.forEach((s) => s && skinSet.add(String(s)));
      else if (p.skin_type) skinSet.add(String(p.skin_type));
      else if (Array.isArray(p.tags)) {
        p.tags.forEach((t) => {
          const low = String(t).toLowerCase();
          if (KNOWN_SKINS.some((k) => low.includes(k))) skinSet.add(t);
        });
      }
    }
    const skinTypes = Array.from(skinSet).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));

    const catSet = new Set(
      items
        .map((p) => p.category || p.type || p.product_type || null)
        .filter(Boolean)
        .map(String)
    );
    const categories = Array.from(catSet).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));

    return { brands, skinTypes, categories };
  }, [items]);

  // Marque active (pour le hero)
  const activeBrand = useMemo(() => {
    if (brandSel.size === 1) return Array.from(brandSel)[0];
    const q = String(search || "").trim().toLowerCase();
    if (!q) return null;
    const exact = facets.brands.find(b => b.toLowerCase() === q);
    return exact || null;
  }, [brandSel, search, facets.brands]);

  const activeCategory = useMemo(() => {
    if (catSel.size === 1) return Array.from(catSel)[0];
    return null;
  }, [catSel]);

  // Applique paramètres URL
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const q = sp.get("q") || "";
    const catSlug = sp.get("cat") || "";
    const catLabel = sp.get("catLabel") || "";
    const brandParam = sp.get("brand") || "";
    const skinSlug = sp.get("skin") || "";
    const skinLabel = sp.get("skinLabel") || "";

    if (q) { setSearch(q); setPage(1); }

    if (catSlug || catLabel) {
      setTimeout(() => {
        const target = catLabel || catSlug;
        const found = facets.categories.find(
          (c) => String(c).toLowerCase() === String(target).toLowerCase()
        );
        const value = found || target;
        setCatSel(new Set([String(value)]));
        setPage(1);
      }, 0);
    }

    if (brandParam) {
      setTimeout(() => {
        const foundBrand = facets.brands.find(
          b => b.toLowerCase() === brandParam.toLowerCase()
        );
        const value = foundBrand || brandParam;
        setBrandSel(new Set([String(value)]));
        setPage(1);
      }, 0);
    }

    if (skinSlug || skinLabel) {
      setTimeout(() => {
        const target = skinLabel || skinSlug;
        const foundSkin = facets.skinTypes.find(
          s => String(s).toLowerCase() === String(target).toLowerCase()
        );
        const value = foundSkin || target;
        setSkinSel(new Set([String(value)]));
        setPage(1);
      }, 0);
    }
  }, [location.search, facets.categories, facets.brands, facets.skinTypes]);

  // Helpers
  const toggleSet = (set, value) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setPage(1);
    return next;
  };

  // Application filtres + tri
  const filteredSorted = useMemo(() => {
    let list = items;

    const q = norm(search.trim());
    if (q) {
      list = list.filter((p) => {
        const fields = [
          p.name,
          p.brand,
          p.slug,
          p.category || p.type || p.product_type,
          ...(Array.isArray(p.skin_types) ? p.skin_types : []),
          ...(Array.isArray(p.tags) ? p.tags : []),
        ].filter(Boolean).map(norm);
        return fields.some(f => f.includes(q));
      });
    }

    if (brandSel.size) list = list.filter((p) => p.brand && brandSel.has(p.brand));

    if (skinSel.size) {
      list = list.filter((p) => {
        const pool = new Set();
        if (Array.isArray(p.skin_types)) p.skin_types.forEach((s) => pool.add(String(s)));
        if (p.skin_type) pool.add(String(p.skin_type));
        if (Array.isArray(p.tags)) p.tags.forEach((t) => pool.add(String(t)));
        for (const s of skinSel) if (pool.has(s)) return true;
        return false;
      });
    }

    if (catSel.size) {
      list = list.filter((p) => {
        const cat = p.category || p.type || p.product_type || null;
        return cat && catSel.has(String(cat));
      });
    }

    list = list.filter((p) => {
      const eur = Number(p.price_cents || 0) / 100;
      return eur >= priceMin && eur <= priceMax;
    });

    switch (sort) {
      case "price_asc":
        list = [...list].sort((a, b) => (a.price_cents || 0) - (b.price_cents || 0));
        break;
      case "price_desc":
        list = [...list].sort((a, b) => (b.price_cents || 0) - (a.price_cents || 0));
        break;
      case "name_asc":
        list = [...list].sort((a, b) =>
          String(a.name).localeCompare(String(b.name), "fr", { sensitivity: "base" })
        );
        break;
      default:
        break; // "reco"
    }

    return list;
  }, [items, search, brandSel, skinSel, catSel, priceMin, priceMax, sort]);

  // Pagination
  const pageCount = Math.max(1, Math.ceil(filteredSorted.length / pageSize));
  const pageClamped = Math.min(Math.max(1, page), pageCount);
  const start = (pageClamped - 1) * pageSize;
  const current = filteredSorted.slice(start, start + pageSize);

  // Pills
  const activePills = useMemo(() => {
    const pills = [];
    if (search.trim()) {
      pills.push({
        type: "search",
        label: `Recherche: “${search.trim()}”`,
        onRemove: () => { setSearch(""); setPage(1); },
      });
    }
    if (brandSel.size) {
      for (const b of brandSel) {
        pills.push({
          type: "brand", value: b, label: `Marque: ${b}`,
          onRemove: () => { const n = new Set(brandSel); n.delete(b); setBrandSel(n); setPage(1); }
        });
      }
    }
    if (skinSel.size) {
      for (const s of skinSel) {
        pills.push({
          type: "skin", value: s, label: `Peau: ${s}`,
          onRemove: () => { const n = new Set(skinSel); n.delete(s); setSkinSel(n); setPage(1); }
        });
      }
    }
    if (catSel.size) {
      for (const c of catSel) {
        pills.push({
          type: "cat", value: c, label: `Type: ${c}`,
          onRemove: () => { const n = new Set(catSel); n.delete(c); setCatSel(n); setPage(1); }
        });
      }
    }
    const prices = items.map((p) => Number(p.price_cents || 0) / 100);
    const globalMin = prices.length ? Math.floor(Math.min(...prices)) : 0;
    const globalMax = prices.length ? Math.ceil(Math.max(...prices)) : 0;
    const priceChanged = priceMin !== globalMin || (priceMax !== globalMax && globalMax !== 0);
    if (priceChanged) {
      pills.push({
        type: "price",
        label: `Prix: ${fmtEur.format(priceMin)} – ${fmtEur.format(priceMax)}`,
        onRemove: () => { setPriceMin(globalMin); setPriceMax(globalMax || 0); setPage(1); }
      });
    }
    if (sort !== "reco") {
      const map = { price_asc: "Prix ↑", price_desc: "Prix ↓", name_asc: "Nom A→Z" };
      pills.push({
        type: "sort",
        label: `Tri: ${map[sort] || sort}`,
        onRemove: () => { setSort("reco"); setPage(1); }
      });
    }
    return pills;
  }, [search, brandSel, skinSel, catSel, priceMin, priceMax, sort, items]);

  function resetAll() {
    setSearch("");
    setBrandSel(new Set());
    setSkinSel(new Set());
    setCatSel(new Set());
    const prices = items.map((p) => Number(p.price_cents || 0) / 100);
    const min = prices.length ? Math.floor(Math.min(...prices)) : 0;
    const max = prices.length ? Math.ceil(Math.max(...prices)) : 0;
    setPriceMin(min);
    setPriceMax(max);
    setSort("reco");
    setPage(1);
  }

  return (
    <main className="cat-wrap">
      <HeaderAll />
      <BrandHero brand={activeBrand} category={activeCategory} />

      <div className="cat-container">
        {/* Barre mobile */}
        <div className="cat-mobile-bar">
          <button className="btn-ghost" onClick={() => setMobileFiltersOpen(true)}>Filtres</button>
          <div className="cat-mobile-sort">
            <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
              <option value="reco">Tri: Recommandé</option>
              <option value="price_asc">Prix: croissant</option>
              <option value="price_desc">Prix: décroissant</option>
              <option value="name_asc">Nom: A → Z</option>
            </select>
          </div>
        </div>

        <div className="cat-grid">
          {/* Sidebar filtres */}
          <aside className={`filters ${mobileFiltersOpen ? "is-open" : ""}`}>
            <div className="filters-head">
              <div className="title">Filtres</div>
              <button className="filters-close" onClick={() => setMobileFiltersOpen(false)}>✕</button>
            </div>

            <div className="filters-body">
              {/* Recherche */}
              <div className="facet">
                <div className="facet-title">Recherche</div>
                <input
                  placeholder="Produit, marque, type, peau…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
              </div>

              {/* Tri (desktop) */}
              <div className="facet desktop-only">
                <div className="facet-title">Tri</div>
                <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
                  <option value="reco">Recommandé</option>
                  <option value="price_asc">Prix: croissant</option>
                  <option value="price_desc">Prix: décroissant</option>
                  <option value="name_asc">Nom: A → Z</option>
                </select>
              </div>

              {/* Marque */}
              <FacetBox title="Marque">
                {facets.brands.length === 0 ? (
                  <div className="muted">—</div>
                ) : (
                  <div className="facet-list">
                    {facets.brands.map((b) => (
                      <label key={b} className="cb">
                        <input
                          type="checkbox"
                          checked={brandSel.has(b)}
                          onChange={() => setBrandSel((s) => toggleSet(s, b))}
                        />
                        <span>{b}</span>
                      </label>
                    ))}
                  </div>
                )}
              </FacetBox>

              {/* Type de peau */}
              <FacetBox title="Type de peau">
                {facets.skinTypes.length === 0 ? (
                  <div className="muted">—</div>
                ) : (
                  <div className="facet-list">
                    {facets.skinTypes.map((s) => (
                      <label key={s} className="cb">
                        <input
                          type="checkbox"
                          checked={skinSel.has(s)}
                          onChange={() => setSkinSel((v) => toggleSet(v, s))}
                        />
                        <span className="capitalize">{s}</span>
                      </label>
                    ))}
                  </div>
                )}
              </FacetBox>

              {/* Catégorie */}
              <FacetBox title="Type de produit">
                {facets.categories.length === 0 ? (
                  <div className="muted">—</div>
                ) : (
                  <div className="facet-list">
                    {facets.categories.map((c) => (
                      <label key={c} className="cb">
                        <input
                          type="checkbox"
                          checked={catSel.has(c)}
                          onChange={() => setCatSel((v) => toggleSet(v, String(c)))}
                        />
                        <span className="capitalize">{c}</span>
                      </label>
                    ))}
                  </div>
                )}
              </FacetBox>

              {/* Prix */}
              <FacetBox title="Prix">
                <div className="row">
                  <label className="small">
                    <span>Min</span>
                    <input
                      type="number"
                      min={0}
                      value={priceMin}
                      onChange={(e) => { setPriceMin(Number(e.target.value)); setPage(1); }}
                    />
                  </label>
                  <label className="small">
                    <span>Max</span>
                    <input
                      type="number"
                      min={0}
                      value={priceMax}
                      onChange={(e) => { setPriceMax(Number(e.target.value)); setPage(1); }}
                    />
                  </label>
                </div>
                <div className="muted tiny">
                  {fmtEur.format(priceMin)} – {fmtEur.format(priceMax)}
                </div>
              </FacetBox>
            </div>

            <div className="filters-foot">
              <button className="btn-ghost" onClick={resetAll}>Tout réinitialiser</button>
              <button className="btn-primary mobile-only" onClick={() => setMobileFiltersOpen(false)}>
                Voir les résultats
              </button>
            </div>
          </aside>

          {/* Liste produits */}
          <section className="products">
            <h1 className="page-title">Catalogue</h1>

            {/* Compteur + pills */}
            <div className="results-bar">
              <div className="count">
                {loading ? "Chargement…" : `${filteredSorted.length} produit${filteredSorted.length > 1 ? "s" : ""} trouvés`}
              </div>

              {activePills.length > 0 && (
                <div className="pills">
                  {activePills.map((p, i) => (
                    <button key={i} className="pill" onClick={p.onRemove} title="Retirer ce filtre">
                      <span>{p.label}</span>
                      <span className="x">✕</span>
                    </button>
                  ))}
                  <button className="pill reset" onClick={resetAll} title="Réinitialiser tous les filtres">
                    Tout effacer
                  </button>
                </div>
              )}
            </div>

            {err && <p className="acc-alert error" style={{marginBottom:10}}>{err}</p>}

            {loading ? (
              <div className="grid">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="card skeleton">
                    <div className="ph-img" />
                    <div className="ph-txt" />
                    <div className="ph-txt short" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid">
                  {current.map((p) => {
                    const inStock = Number.isFinite(p.stock) ? p.stock > 0 : true;
                    const isPack = String(p.category || "").toLowerCase() === "pack";
                    const to = `/${isPack ? "pack" : "produit"}/${p.slug || String(p.id)}`;

                    // >>> images primaire + hover
                    const imgs = collectImages(p, 2);
                    const imgPrimary = imgs[0] || fallbackImg;
                    const imgHover = imgs[1] || imgPrimary;

                    return (
                      <Link key={p.id} to={to} className="card">
                        <div className="thumb">
                          {/* image principale */}
                          <img
                            className="img primary"
                            src={imgPrimary}
                            alt={p.name}
                            onError={(e) => { e.currentTarget.src = fallbackImg; }}
                            loading="lazy"
                          />
                          {/* image hover */}
                          <img
                            className="img secondary"
                            src={imgHover}
                            alt=""
                            onError={(e) => { e.currentTarget.src = fallbackImg; }}
                            loading="lazy"
                          />

                          {/* Ruban -10% pour les packs */}
                          {isPack && <div className="cat-ribbon">-10%</div>}

                          {/* Pastille PACK */}
                          {isPack && <div className="cat-pill">PACK</div>}

                          <span className={`badge ${inStock ? "ok" : "ko"}`}>
                            {inStock ? "En stock" : "Épuisé"}
                          </span>
                        </div>

                        <div className="meta">
                          {p.brand && <div className="brand">{p.brand}</div>}

                          <div className="badges">
                            {p.category && (
                              <div className={`catBadge cat-${slugify(p.category)}`}>
                                {p.category}
                              </div>
                            )}
                            {Array.isArray(p.skin_types) && p.skin_types.length > 0 && (
                              <div className="skinsGroup" aria-label="Types de peau">
                                {p.skin_types.map((s, i) => (
                                  <span key={i} className={`skinChip skin-${slugify(s)}`}>
                                    {s}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="name">{p.name}</div>
                          <div className="price">{fmtEur.format((p.price_cents || 0) / 100)}</div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {!current.length && !loading && (
                  <div className="muted" style={{ padding: "12px 4px" }}>
                    Aucun produit ne correspond à ces filtres.
                  </div>
                )}

                {/* Pagination */}
                {filteredSorted.length > 0 && (
                  <div className="pagination">
                    <div className="pag-left">
                      <button
                        className="btn-ghost"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={pageClamped <= 1}
                      >
                        ← Précédent
                      </button>
                      <button
                        className="btn-ghost"
                        onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                        disabled={pageClamped >= pageCount}
                      >
                        Suivant →
                      </button>
                    </div>
                    <div className="pag-mid">
                      Page {pageClamped} / {pageCount}
                    </div>
                    <div className="pag-right">
                      <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
                        <option value={12}>12 / page</option>
                        <option value={24}>24 / page</option>
                        <option value={36}>36 / page</option>
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}

function FacetBox({ title, children }) {
  return (
    <div className="facet">
      <div className="facet-title">{title}</div>
      {children}
    </div>
  );
}
