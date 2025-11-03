// src/pages/FavoriPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useFavorites } from "../favorites/FavoritesContext";
import { useCart } from "../cart/CartContext";
import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import "./Favoris.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:4242";
const fmtEur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

function publicAsset(p) {
  if (!p) return null;
  if (/^https?:\/\//i.test(p)) return p;
  const base = import.meta.env.BASE_URL || "/";
  const rel = String(p).replace(/^(\.\/|\.\.\/)+/, "").replace(/^\/+/, "");
  return (base.endsWith("/") ? base : base + "/") + rel;
}

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

function collectImages(entity, max = 2) {
  const out = [];
  if (Array.isArray(entity?.images)) out.push(...entity.images);
  if (entity?.image) out.push(entity.image);
  const uniq = Array.from(new Set(out.filter(Boolean).map(publicAsset)));
  return (uniq.length ? uniq : [fallbackImg]).slice(0, max);
}

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function FavoriPage() {
  const favCtx = useFavorites() || {};
  const favorites = Array.isArray(favCtx.favorites) ? favCtx.favorites : [];
  const remove = typeof favCtx.remove === "function" ? favCtx.remove : () => {};
  const clear = typeof favCtx.clear === "function" ? favCtx.clear : () => {};
  const { add } = useCart();

  const [enriched, setEnriched] = useState(favorites);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const out = await Promise.all(
        favorites.map(async (f) => {
          const hasTwo =
            Array.isArray(f.images) && f.images.length >= 2;
          const hasMeta =
            f.category || (Array.isArray(f.skin_types) && f.skin_types.length > 0);
          if (hasTwo && hasMeta) return f;

          const key = String(f.slug || f.id);
          try {
            const r = await fetch(
              `${API}/api/products/${encodeURIComponent(key)}`,
              { credentials: "include" }
            );
            if (!r.ok) throw new Error("not ok");
            const full = await r.json();
            return {
              ...full,
              ...f,
              images: full.images ?? f.images,
              image: full.image ?? f.image,
            };
          } catch {
            return f;
          }
        })
      );
      if (!cancelled) setEnriched(out);
    })();
    return () => {
      cancelled = true;
    };
  }, [JSON.stringify(favorites)]);

  const addToCart = (p) => {
    const preview = collectImages(p, 1)[0] || fallbackImg;
    add(
      {
        id: String(p.id),
        name: p.name,
        price_cents: Number(p.price_cents || 0),
        image: preview,
        slug: p.slug || null,
        brand: p.brand || "",
      },
      1
    );
  };

  const list = useMemo(() => enriched, [enriched]);

  return (
    <main className="fav-wrap">
      <SiteHeader />

      <section className="fav-container">
        <div className="fav-head">
          <div className="fav-head-left">
            <h1 className="fav-title">Mes favoris</h1>
            <p className="fav-sub">
              {list.length
                ? `${list.length} article${list.length > 1 ? "s" : ""} enregistré${
                    list.length > 1 ? "s" : ""
                  }.`
                : "Aucun favori pour le moment."}
            </p>
          </div>

          {list.length > 0 && (
            <div className="fav-actions">
              <Link to="/catalogue" className="btn-ghost">
                ← Continuer mes achats
              </Link>

              {/* on lui met une classe pour pouvoir le cacher/replacer en mobile */}
              <button className="btn-danger fav-clear-all" onClick={clear}>
                Retirer tout
              </button>
            </div>
          )}
        </div>

        {list.length === 0 ? (
          <div className="fav-empty">
            <div className="empty-illustration" aria-hidden>
              🤍
            </div>
            <h2>Ta liste est encore vide</h2>
            <p>Ajoute des produits que tu aimes pour les retrouver facilement.</p>
            <Link to="/catalogue" className="btn-primary">
              Découvrir le catalogue
            </Link>
          </div>
        ) : (
          <div className="fav-grid" role="list">
            {list.map((p) => {
              const imgs = collectImages(p, 2);
              const imgPrimary = imgs[0] || fallbackImg;
              const imgHover = imgs[1] || imgPrimary;
              const slug = p.slug || String(p.id);
              const inStock = Number.isFinite(p.stock) ? p.stock > 0 : true;

              return (
                <article key={p.id} className="fav-card" role="listitem">
                  <button
                    className="fav-remove"
                    onClick={() => remove(p.id)}
                    title="Retirer des favoris"
                    aria-label="Retirer des favoris"
                  >
                    ✕
                  </button>

                  <Link
                    to={`/produit/${slug}`}
                    className="fav-thumb"
                    aria-label={`${p.brand || ""} ${p.name}`}
                  >
                    <img
                      className="img primary"
                      src={imgPrimary}
                      alt={p.name}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = fallbackImg;
                      }}
                    />
                    <img
                      className="img secondary"
                      src={imgHover}
                      alt=""
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = fallbackImg;
                      }}
                    />

                    {inStock ? (
                      <span className="badge ok">En stock</span>
                    ) : (
                      <span className="badge ko">Épuisé</span>
                    )}
                  </Link>

                  <div className="fav-meta">
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

                    <Link to={`/produit/${slug}`} className="name">
                      {p.name}
                    </Link>

                    <div className="price">
                      {fmtEur.format(Number(p.price_cents || 0) / 100)}
                    </div>
                  </div>

                  <div className="fav-cta">
                    <button
                      className="btn-primary add-cart-btn"
                      onClick={() => addToCart(p)}
                    >
                      Ajouter au panier
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
