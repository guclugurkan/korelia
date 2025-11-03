// src/components/PackHomePage.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./BestSellers.css"; // on continue de réutiliser les styles
import { useCart } from "../cart/CartContext";
import FavoriteButton from "../components/FavoriteButton";
import { apiGet } from "../lib/api";

const fallbackImg =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='500' height='500'>
      <rect width='100%' height='100%' fill='#f3f4f6'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#9ca3af' font-family='system-ui,Segoe UI,Roboto,Arial' font-size='16'>
        Image indisponible
      </text>
    </svg>`
  );

// résout l'URL d'une image (pour public/)
function publicAsset(p) {
  if (!p) return null;
  if (/^https?:\/\//i.test(p)) return p;
  const base = import.meta.env.BASE_URL || "/";
  const rel = String(p).replace(/^(\.\/|\.\.\/)+/, "").replace(/^\/+/, "");
  return (base.endsWith("/") ? base : base + "/") + rel;
}

// récupère jusqu'à 2 images
function collectImages(entity, max = 2) {
  const out = [];
  if (Array.isArray(entity?.images)) out.push(...entity.images);
  if (entity?.image) out.push(entity.image);
  const uniq = Array.from(new Set(out.filter(Boolean).map(publicAsset)));
  return (uniq.length ? uniq : [fallbackImg]).slice(0, max);
}

const euro = (cents) =>
  (Number(cents || 0) / 100).toFixed(2) + " €";

export default function PackHomePage() {
  const [packs, setPacks] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const { add } = useCart();

  // charge tous les produits et isole ceux en catégorie "pack"
  useEffect(() => {
    (async () => {
      try {
        setErr("");
        setLoading(true);

        const data = await apiGet("/api/products");

        const onlyPacks = (Array.isArray(data) ? data : []).filter(
          (p) => String(p.category || "").toLowerCase() === "pack"
        );

        // enrichir si besoin d'images sup
        const enriched = await Promise.all(
          onlyPacks.map(async (p) => {
            const hasTwo = Array.isArray(p.images) && p.images.length >= 2;
            if (hasTwo) return p;
            try {
              const key = String(p.slug || p.id);
              const full = await apiGet(`/api/products/${key}`);

              const images = Array.isArray(full.images) ? full.images : p.images;
              const image = full.image ?? p.image;

              return { ...p, images, image };
            } catch {
              return p;
            }
          })
        );

        setPacks(enriched);
      } catch (e) {
        setErr(e.message || "Erreur");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ajoute le pack au panier
  const addFromCard = (p) => {
    const preview = collectImages(p, 1)[0] || fallbackImg;
    add(
      {
        id: String(p.id),
        name: p.name,
        price_cents: Number(p.price_cents || 0),
        image: preview,
        slug: p.slug || null,
        brand: p.brand || "Pack",
      },
      1
    );
  };

  if (err) {
    return (
      <section className="bestSellers">
        <div className="bs-header">
          <h1 className="bs-title">Packs routines</h1>
        </div>
        <p style={{ color: "#c33", padding: 12 }}>{err}</p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="bestSellers">
        <div className="bs-header">
          <h1 className="bs-title">Packs routines</h1>
        </div>
        <p style={{ padding: 12 }}>Chargement…</p>
      </section>
    );
  }

  if (!packs.length) {
    return (
      <section className="bestSellers">
        <div className="bs-header">
          <h1 className="bs-title">Packs routines</h1>
        </div>
        <p style={{ padding: 12, color: "#666" }}>Aucun pack pour le moment.</p>
      </section>
    );
  }

  return (
    <section className="bestSellers" aria-labelledby="packs-title">
      {/* Titre centré + barre */}
      <div className="bs-header">
        <h1 id="packs-title" className="bs-title">
          Packs routines
        </h1>
      </div>

      {/* swipe horizontal comme BestSellers */}
      <div className="bs-rail-wrapper">
        <div className="bs-rail" role="list" aria-live="polite">
          {packs.map((p, i) => {
            const slug = p.slug || String(p.id);
            const imgs = collectImages(p, 2);
            const imgPrimary = imgs[0] || fallbackImg;
            const imgHover = imgs[1] || imgPrimary;

            const oos = Number.isFinite(p.stock) && p.stock <= 0;

            return (
              <article
                key={p.id}
                className="bs-card"
                role="listitem"
                style={{ "--i": i }}
              >
                {/* vignette image du pack */}
                <Link
                  className={`thumb ${oos ? "is-oos" : ""}`}
                  to={`/pack/${slug}`}
                  aria-label={`${p.brand || "Pack"} ${p.name}`}
                >
                  {/* image principale */}
                  <img
                    className="img primary"
                    src={imgPrimary}
                    alt={`${p.brand || "Pack"} ${p.name}`}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = fallbackImg;
                    }}
                  />
                  {/* image hover */}
                  <img
                    className="img secondary"
                    src={imgHover}
                    alt=""
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = fallbackImg;
                    }}
                  />

                  {/* badge -10% pack */}
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      left: 8,
                      background: "#111827",
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 800,
                      padding: "4px 8px",
                      borderRadius: 999,
                      zIndex: 2,
                    }}
                  >
                    -10% pack
                  </div>

                  {/* bouton panier */}
                  <button
                    className="addBtn"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      if (oos) return;
                      addFromCard(p);
                    }}
                    disabled={oos}
                    aria-disabled={oos ? "true" : "false"}
                    title={oos ? "Rupture de stock" : "Ajouter au panier"}
                  >
                    {oos ? "Indisponible" : "Ajouter au panier"}
                  </button>

                  {/* favoris */}
                  <div className="bs-fav">
                    <FavoriteButton product={p} size={22} className="bs-fav-btn" />
                  </div>

                  {/* overlay rupture */}
                  {oos && (
                    <div className="oos-cover">
                      <span>Victime de succès</span>
                    </div>
                  )}
                </Link>

                {/* texte sous la vignette */}
                <div className="meta">
                  <div className="brand">{p.brand || "Pack"}</div>

                  <h3 className="name">{p.name}</h3>

                  <div className="priceRow">
                    <span className="pricee">{euro(p.price_cents)}</span>

                    {Number.isFinite(p.stock) &&
                      (p.stock === 1 || p.stock === 2) && (
                        <span className="stock-hint">
                          Plus que {p.stock} en stock
                        </span>
                      )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* CTA final */}
      <div className="bs-footer">
        <Link
          className="bs-more"
          to="/catalogue?cat=pack&catLabel=pack"
        >
          Voir tous les packs
        </Link>
      </div>
    </section>
  );
}
