// src/pages/Catalogue.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";

import Footer from "../components/Footer";
import "./Catalogue.css";
import "./../components/BestSellers.css"; // réutilise les styles .thumb .img.primary/.secondary
import { apiGet } from "../lib/api";
import FavoriteButton from "../components/FavoriteButton";
import { useCart } from "../cart/CartContext";
import SiteHeader from "../components/SiteHeader";
import { Helmet } from 'react-helmet-async';

// --- Héros de marque
const BRAND_HERO = {
  ANUA: "/img/hero/anuahero.png",
  "Beauty of Joseon": "/img/hero/bojhero.png",
  Biodance: "/img/hero/biodancehero.png",
  COSRX: "/img/hero/cosrxhero.png",
  "Dr. Althea": "/img/hero/draltheahero.png",
  "HaruHaru Wonder": "/img/hero/haruharuhero.png",
  "I'M FROM": "/img/hero/imfromhero.png",
  iUNIK: "/img/hero/iunikhero.png",
  Laneige: "/img/hero/laneigehero.png",
  Medicube: "/img/hero/medicubehero.png",
  Mixsoon: "/img/hero/mixsoonhero.png",
  "Round Lab": "/img/hero/roundlabhero.png",
  SKIN1004: "/img/hero/skin1004hero.png",
  "SOME BY MI": "/img/hero/somebymihero.png",
  TORRIDEN: "/img/hero/img3.png",
};
const GLOBAL_HERO = "/img/hero/imgcat3.png";

// Image héros pour la catégorie "pack"
const CATEGORY_HERO = {
  pack: "/img/hero/packhero.png",
};

function BrandHero({ brand, category }) {
  const catKey = String(category || "").toLowerCase();
  const catSrc = CATEGORY_HERO[catKey];
  const brandSrc = brand && BRAND_HERO[brand] ? BRAND_HERO[brand] : null;
  const src = catSrc || brandSrc || GLOBAL_HERO;

  const label = category ? String(category) : brand ? brand : "Toutes les marques";
  const badge = category ? "Pack" : brand ? "Marque" : "Catalogue";
  const title = category ? `Nos ${String(category)}s` : brand || "Découvre nos produits";

  return (
    <section className="cat-hero" role="img" aria-label={label}>
      <img
        src={publicAsset(src)}
        alt=""
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
      <div className="cat-hero-overlay" />
      <div className="cat-hero-inner">
        <div className="cat-hero-badge">{badge}</div>
        <h1 className="cat-hero-title">{title}</h1>
        {!brand && !category && <p className="cat-hero-sub"></p>}
      </div>
    </section>
  );
}

// --- Utils
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
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// normalise pour recherche (enlève accents + toLowerCase)
function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Prix pack = somme produits inclus + remisé -10% */
function computePackPricing(allItems, pack) {
  if (!pack || !Array.isArray(pack.products_included)) {
    return { detailSumCents: 0, discountedCents: 0 };
  }
  const keys = new Set(pack.products_included.map(String));
  const included = allItems.filter(
    (p) => keys.has(String(p.id)) || keys.has(String(p.slug))
  );
  const detailSumCents = included.reduce((s, p) => s + Number(p.price_cents || 0), 0);
  const discountedCents = Math.round(detailSumCents * 0.9);
  return { detailSumCents, discountedCents };
}

/** Prix effectif (produit = prix normal, pack = prix remisé) */
function effectivePriceCents(allItems, item) {
  const isPack = String(item.category || "").toLowerCase() === "pack";
  if (!isPack) return Number(item.price_cents || 0);
  const { discountedCents } = computePackPricing(allItems, item);
  return discountedCents || Number(item.price_cents || 0);
}

// --- Helpers URL <-> State
function splitCsv(v) {
  return (v || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
function joinCsv(setOrArr) {
  const arr = Array.isArray(setOrArr) ? setOrArr : Array.from(setOrArr || []);
  return arr.join(",");
}

export default function Catalogue() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [hydratedFromURL, setHydratedFromURL] = useState(false);

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

  const { add } = useCart();

  // feedback visuel : id du dernier produit ajouté au panier
  const [addedId, setAddedId] = useState(null);

  // Mobile overlay
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // add to cart avec prix effectif + petit feedback
  const addFromCard = (p) => {
    const imgs = collectImages(p, 1);
    const preview = imgs[0] || fallbackImg;
    const price_cents = effectivePriceCents(items, p);
    add(
      {
        id: String(p.id),
        name: p.name,
        price_cents: Number(price_cents || 0),
        image: preview,
        slug: p.slug || null,
        brand: p.brand || "",
      },
      1
    );

    // feedback "Ajouté ✓" sur ce produit pendant ~1,2s
    setAddedId(p.id);
    setTimeout(() => {
      setAddedId((current) => (current === p.id ? null : current));
    }, 1200);
  };

  // Charge les produits + enrichit
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setErr("");
        setLoading(true);

        const data = await apiGet("/api/products");
        if (cancelled) return;

        const arr = Array.isArray(data) ? data : [];

        const enriched = await Promise.all(
          arr.map(async (p) => {
            const isPack = String(p.category || "").toLowerCase() === "pack";
            const needImages = !(Array.isArray(p.images) && p.images.length >= 2);

            if (isPack || needImages) {
              try {
                const key = String(p.slug || p.id);
                const full = await apiGet(`/api/products/${key}`);
                return {
                  ...p,
                  images: Array.isArray(full.images) ? full.images : p.images,
                  image: full.image ?? p.image,
                  products_included: Array.isArray(full.products_included)
                    ? full.products_included
                    : p.products_included,
                };
              } catch {
                return p;
              }
            }
            return p;
          })
        );

        setItems(enriched);

        // bornes prix initiales à partir des PRIX EFFECTIFS
        const prices = enriched.map((it) => effectivePriceCents(enriched, it) / 100);
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
    return () => {
      cancelled = true;
    };
  }, []);

  // Facettes
  const facets = useMemo(() => {
    const brands = Array.from(new Set(items.map((p) => p.brand).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, "fr", { sensitivity: "base" })
    );

    const KNOWN_SKINS = [
      "grasse",
      "mixte",
      "sèche",
      "sensible",
      "normale",
      "acnéique",
      "déshydratée",
      "mature",
      "terne",
      "pores-visibles",
      "anti-âge",
      "anti-taches",
      "abîmée",
      "réactive",
      "tous",
    ];
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
    const skinTypes = Array.from(skinSet).sort((a, b) =>
      a.localeCompare(b, "fr", { sensitivity: "base" })
    );

    const catSet = new Set(
      items
        .map((p) => p.category || p.type || p.product_type || null)
        .filter(Boolean)
        .map(String)
    );
    const categories = Array.from(catSet).sort((a, b) =>
      a.localeCompare(b, "fr", { sensitivity: "base" })
    );

    return { brands, skinTypes, categories };
  }, [items]);

  // Marque/Catégorie actives (pour le hero)
  const activeBrand = useMemo(() => {
    if (brandSel.size === 1) return Array.from(brandSel)[0];
    const q = String(search || "").trim().toLowerCase();
    if (!q) return null;
    const exact = facets.brands.find((b) => b.toLowerCase() === q);
    return exact || null;
  }, [brandSel, search, facets.brands]);

  const activeCategory = useMemo(() => {
    if (catSel.size === 1) return Array.from(catSel)[0];
    return null;
  }, [catSel]);

  // === 1) LECTURE URL => STATE
  useEffect(() => {
    // On a besoin des bornes pour comparer défauts
    const prices = items.map((it) => effectivePriceCents(items, it) / 100);
    const globalMin = prices.length ? Math.floor(Math.min(...prices)) : 0;
    const globalMax = prices.length ? Math.ceil(Math.max(...prices)) : 0;

    // Lecture query
    const q = searchParams.get("q") || "";
    const brandsParam = splitCsv(searchParams.get("brands"));
    const skinsParam = splitCsv(searchParams.get("skins"));
    const catsParam = splitCsv(searchParams.get("cats"));
    const sortParam = searchParams.get("sort") || "reco";
    const pageParam = Number(searchParams.get("page") || 1);
    const sizeParam = Number(searchParams.get("size") || PAGE_SIZE_DEFAULT);
    const pminParam = Number(searchParams.get("pmin") ?? globalMin);
    const pmaxParam = Number(searchParams.get("pmax") ?? (globalMax || 0));

    // mapping insensibles à la casse pour brands/skins/cats
    const mapCase = (arr, pool) => {
      if (!arr.length) return [];
      const lowerPool = new Map(pool.map((v) => [String(v).toLowerCase(), v]));
      return arr
        .map((s) => lowerPool.get(String(s).toLowerCase()) || s)
        .filter(Boolean);
    };

    setSearch(q);
    setBrandSel(new Set(mapCase(brandsParam, facets.brands)));
    setSkinSel(new Set(mapCase(skinsParam, facets.skinTypes)));
    setCatSel(new Set(mapCase(catsParam, facets.categories)));
    setSort(sortParam);
    setPage(Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1);
    setPageSize([12, 24, 36].includes(sizeParam) ? sizeParam : PAGE_SIZE_DEFAULT);

    // prix: si pas dans l'URL, on remet bornes globales
    setPriceMin(Number.isFinite(pminParam) ? pminParam : globalMin);
    setPriceMax(Number.isFinite(pmaxParam) ? pmaxParam : (globalMax || 0));

    setHydratedFromURL(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, facets.brands, facets.skinTypes, facets.categories, items.length]);

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
        ]
          .filter(Boolean)
          .map(norm);
        return fields.some((f) => f.includes(q));
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

    // filtre prix (PRIX EFFECTIF)
    list = list.filter((p) => {
      const eur = effectivePriceCents(items, p) / 100;
      return eur >= priceMin && eur <= priceMax;
    });

    // tri
    switch (sort) {
      case "price_asc":
        list = [...list].sort(
          (a, b) => effectivePriceCents(items, a) - effectivePriceCents(items, b)
        );
        break;
      case "price_desc":
        list = [...list].sort(
          (a, b) => effectivePriceCents(items, b) - effectivePriceCents(items, a)
        );
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

  // === 2) STATE => ÉCRITURE URL (après calcul de pageClamped)
  useEffect(() => {
    if (!hydratedFromURL || items.length === 0) return;
    const prices = items.map((it) => effectivePriceCents(items, it) / 100);
    const globalMin = prices.length ? Math.floor(Math.min(...prices)) : 0;
    const globalMax = prices.length ? Math.ceil(Math.max(...prices)) : 0;

    const sp = new URLSearchParams();

    if (search.trim()) sp.set("q", search.trim());
    if (brandSel.size) sp.set("brands", joinCsv(Array.from(brandSel)));
    if (skinSel.size) sp.set("skins", joinCsv(Array.from(skinSel)));
    if (catSel.size) sp.set("cats", joinCsv(Array.from(catSel)));
    if (sort !== "reco") sp.set("sort", sort);
    if (pageClamped > 1) sp.set("page", String(pageClamped));
    if (pageSize !== PAGE_SIZE_DEFAULT) sp.set("size", String(pageSize));

    // N'écrit pmin/pmax que s'ils diffèrent des bornes globales
    const overrideMin = priceMin !== globalMin;
    const overrideMax = priceMax !== (globalMax || 0);
    if (overrideMin) sp.set("pmin", String(priceMin));
    if (overrideMax) sp.set("pmax", String(priceMax));

    const next = sp.toString();
    if (next !== searchParams.toString()) {
      setSearchParams(sp, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    search,
    brandSel,
    skinSel,
    catSel,
    sort,
    pageClamped, // 👈 clé: on écrit la page clamped
    pageSize,
    priceMin,
    priceMax,
    items.length,
    hydratedFromURL,
  ]);

  // Pills
  const activePills = useMemo(() => {
    const pills = [];
    if (search.trim()) {
      pills.push({
        type: "search",
        label: `Recherche: “${search.trim()}”`,
        onRemove: () => {
          setSearch("");
          setPage(1);
        },
      });
    }
    if (brandSel.size) {
      for (const b of brandSel) {
        pills.push({
          type: "brand",
          value: b,
          label: `Marque: ${b}`,
          onRemove: () => {
            const n = new Set(brandSel);
            n.delete(b);
            setBrandSel(n);
            setPage(1);
          },
        });
      }
    }
    if (skinSel.size) {
      for (const s of skinSel) {
        pills.push({
          type: "skin",
          value: s,
          label: `Peau: ${s}`,
          onRemove: () => {
            const n = new Set(skinSel);
            n.delete(s);
            setSkinSel(n);
            setPage(1);
          },
        });
      }
    }
    if (catSel.size) {
      for (const c of catSel) {
        pills.push({
          type: "cat",
          value: c,
          label: `Type: ${c}`,
          onRemove: () => {
            const n = new Set(catSel);
            n.delete(c);
            setCatSel(n);
            setPage(1);
          },
        });
      }
    }
    const prices = items.map((it) => effectivePriceCents(items, it) / 100);
    const globalMin = prices.length ? Math.floor(Math.min(...prices)) : 0;
    const globalMax = prices.length ? Math.ceil(Math.max(...prices)) : 0;
    const priceChanged = priceMin !== globalMin || (priceMax !== globalMax && globalMax !== 0);
    if (priceChanged) {
      pills.push({
        type: "price",
        label: `Prix: ${fmtEur.format(priceMin)} – ${fmtEur.format(priceMax)}`,
        onRemove: () => {
          setPriceMin(globalMin);
          setPriceMax(globalMax || 0);
          setPage(1);
        },
      });
    }
    if (sort !== "reco") {
      const map = { price_asc: "Prix ↑", price_desc: "Prix ↓", name_asc: "Nom A→Z" };
      pills.push({
        type: "sort",
        label: `Tri: ${map[sort] || sort}`,
        onRemove: () => {
          setSort("reco");
          setPage(1);
        },
      });
    }
    return pills;
  }, [search, brandSel, skinSel, catSel, priceMin, priceMax, sort, items]);

  function resetAll() {
    setSearch("");
    setBrandSel(new Set());
    setSkinSel(new Set());
    setCatSel(new Set());
    const prices = items.map((it) => effectivePriceCents(items, it) / 100);
    const min = prices.length ? Math.floor(Math.min(...prices)) : 0;
    const max = prices.length ? Math.ceil(Math.max(...prices)) : 0;
    setPriceMin(min);
    setPriceMax(max);
    setSort("reco");
    setPage(1);
  }

  // Conserver la query quand on ouvre un produit
  const currentQuery = searchParams.toString();
  const withQuery = (path) => (currentQuery ? `${path}?${currentQuery}` : path);

  return (
    <main className="cat-wrap">



      <Helmet>
        <title>Catalogue — Korelia</title>
        <meta
          name="description"
          content="Parcourez notre catalogue de skincare coréenne : nettoyants, sérums, crèmes, SPF. Livraison en Belgique, France, Luxembourg."
        />
        <link rel="canonical" href="https://korelia.be/catalogue" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Catalogue — Korelia" />
        <meta property="og:description" content="Tous nos produits skincare coréenne, en stock, expédiés rapidement." />
        <meta property="og:url" content="https://korelia.be/catalogue" />
        <meta property="og:image" content="https://korelia.be/img/og-cover.jpg" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>




      <SiteHeader />
      <BrandHero brand={activeBrand} category={activeCategory} />

      <div className="cat-container">
        {/* Barre mobile */}
        <div className="cat-mobile-bar">
          <button className="btn-ghost" onClick={() => setMobileFiltersOpen(true)}>
            Filtres
          </button>
          <div className="cat-mobile-sort">
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
            >
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
              <button className="filters-close" onClick={() => setMobileFiltersOpen(false)}>
                ✕
              </button>
            </div>

            <div className="filters-body">
              {/* Recherche */}
              <div className="facet">
                <div className="facet-title">Recherche</div>
                <input
                  placeholder="Produit, marque, type, peau…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              {/* Tri (desktop) */}
              <div className="facet desktop-only">
                <div className="facet-title">Tri</div>
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    setPage(1);
                  }}
                >
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
                          onChange={(e) => setSkinSel((v) => toggleSet(v, s))}
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
                          onChange={(e) => setCatSel((v) => toggleSet(v, String(c)))}
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
                      onChange={(e) => {
                        setPriceMin(Number(e.target.value));
                        setPage(1);
                      }}
                    />
                  </label>
                  <label className="small">
                    <span>Max</span>
                    <input
                      type="number"
                      min={0}
                      value={priceMax}
                      onChange={(e) => {
                        setPriceMax(Number(e.target.value));
                        setPage(1);
                      }}
                    />
                  </label>
                </div>
                <div className="muted tiny">
                  {fmtEur.format(priceMin)} – {fmtEur.format(priceMax)}
                </div>
              </FacetBox>
            </div>

            <div className="filters-foot">
              <button className="btn-ghost" onClick={resetAll}>
                Tout réinitialiser
              </button>
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
                {loading
                  ? "Chargement…"
                  : `${filteredSorted.length} produit${filteredSorted.length > 1 ? "s" : ""} trouvés`}
              </div>

              {/* Pills */}
              {activePills.length > 0 && (
                <div className="pills">
                  {activePills.map((p, i) => (
                    <button
                      key={i}
                      className={`pill pill-${p.type || "generic"}`}
                      onClick={p.onRemove}
                      title="Retirer ce filtre"
                    >
                      <span className="pill-label">{p.label}</span>
                      <span className="x" aria-hidden>
                        ✕
                      </span>
                    </button>
                  ))}
                  <button className="pill reset" onClick={resetAll} title="Réinitialiser tous les filtres">
                    Tout effacer
                  </button>
                </div>
              )}
            </div>

            {err && (
              <p className="acc-alert error" style={{ marginBottom: 10 }}>
                {err}
              </p>
            )}

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
                    const outOfStock = Number.isFinite(p.stock) ? p.stock <= 0 : false;
                    const isPack = String(p.category || "").toLowerCase() === "pack";
                    const basePath = `/${isPack ? "pack" : "produit"}/${p.slug || String(p.id)}`;
                    const to = withQuery(basePath);

                    // images
                    const imgs = collectImages(p, 2);
                    const imgPrimary = imgs[0] || fallbackImg;
                    const imgHover = imgs[1] || imgPrimary;

                    // message faible stock UNIQUEMENT pour 1 ou 2
                    const lowStockMsg =
                      Number.isFinite(p.stock) && (p.stock === 1 || p.stock === 2)
                        ? `Plus que ${p.stock} en stock`
                        : null;

                    // prix effectif
                    const { detailSumCents, discountedCents } = isPack
                      ? computePackPricing(items, p)
                      : { detailSumCents: 0, discountedCents: Number(p.price_cents || 0) };

                    const isJustAdded = !outOfStock && addedId === p.id;

                    return (
                      <Link key={p.id} to={to} className="card">
                        <div className={`thumb ${outOfStock ? "is-oos" : ""}`}>
                          {/* IMAGES */}
                          <img
                            className="img primary"
                            src={imgPrimary}
                            alt={p.name}
                            onError={(e) => {
                              e.currentTarget.src = fallbackImg;
                            }}
                            loading="lazy"
                          />
                          <img
                            className="img secondary"
                            src={imgHover}
                            alt=""
                            onError={(e) => {
                              e.currentTarget.src = fallbackImg;
                            }}
                            loading="lazy"
                          />

                          {/* BOUTON (désactivé si OOS) */}
                          <button
                            className={`addBtn ${isJustAdded ? "ok" : ""}`}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              if (outOfStock) return;
                              addFromCard(p);
                            }}
                            disabled={outOfStock}
                            aria-disabled={outOfStock ? "true" : "false"}
                            aria-label={
                              outOfStock
                                ? `${p.name} indisponible`
                                : isJustAdded
                                ? `${p.name} ajouté au panier`
                                : `Ajouter ${p.name} au panier`
                            }
                            title={outOfStock ? "Rupture de stock" : "Ajouter au panier"}
                          >
                            {outOfStock
                              ? "Indisponible"
                              : isJustAdded
                              ? "Ajouté ✓"
                              : "Ajouter au panier"}
                          </button>

                          {/* TOPBAR chips + fav */}
                          <div className="thumb-topbar">
                            <div className="chips">
                              {isPack && <div className="chip chip-discount">-10%</div>}
                              {isPack && <div className="chip chip-pack">PACK</div>}
                            </div>
                            <div className="thumb-fav">
                              <FavoriteButton product={p} size={38} />
                            </div>
                          </div>

                          {/* OVERLAY OOS pleine image */}
                          {outOfStock && (
                            <div className="oos-cover">
                              <span>Victime de succès</span>
                            </div>
                          )}
                        </div>

                        <div className="meta">
                          {p.brand && <div className="brand">{p.brand}</div>}

                          <div className="badges">
                            {p.category && (
                              <div className={`catBadge cat-${slugify(p.category)}`}>{p.category}</div>
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

                          {/* PRIX (produit normal ou pack avec barré) */}
                          <div className="price">
                            {fmtEur.format((discountedCents || 0) / 100)}
                            {isPack && detailSumCents > 0 && discountedCents < detailSumCents && (
                              <s className="stock-hint" style={{ marginLeft: 6 }}>
                                {fmtEur.format(detailSumCents / 100)}
                              </s>
                            )}
                            {/* low stock UNIQUEMENT pour 1 ou 2 */}
                            {lowStockMsg && <span className="stock-hint">{lowStockMsg}</span>}
                          </div>
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
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setPage(1);
                        }}
                      >
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
