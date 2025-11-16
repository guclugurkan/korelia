// src/components/PackHomePage.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./BestSellers.css";
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

// assets du public/
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

const fmtEur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

// ---- Helper prix pack (somme + -10%)
function computePackPricing(allProducts, pack) {
  if (!pack || !Array.isArray(pack.products_included)) {
    return { detailSumCents: 0, discountedCents: 0, included: [] };
  }
  const keys = new Set(pack.products_included.map(String));
  const included = allProducts.filter(
    (p) => keys.has(String(p.id)) || keys.has(String(p.slug))
  );
  const detailSumCents = included.reduce((s, p) => s + Number(p.price_cents || 0), 0);
  const discountedCents = Math.round(detailSumCents * 0.9); // -10%
  return { detailSumCents, discountedCents, included };
}

export default function PackHomePage() {
  const [packs, setPacks] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // <— NEW
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const { add } = useCart();

  useEffect(() => {
    (async () => {
      try {
        setErr("");
        setLoading(true);

        // 1) on récupère TOUT
        const data = await apiGet("/api/products");
        const arr = Array.isArray(data) ? data : [];
        setAllProducts(arr);

        // 2) on isole les packs
        const onlyPacks = arr.filter(
          (p) => String(p.category || "").toLowerCase() === "pack"
        );

        // 3) on enrichit chaque pack (au cas où il manque des images)
        const enriched = await Promise.all(
          onlyPacks.map(async (p) => {
            const hasTwo = Array.isArray(p.images) && p.images.length >= 2;
            if (hasTwo && Array.isArray(p.products_included)) return p;
            try {
              const key = String(p.slug || p.id);
              const full = await apiGet(`/api/products/${key}`);
              const images = Array.isArray(full.images) ? full.images : p.images;
              const image = full.image ?? p.image;
              const products_included = Array.isArray(full.products_included)
                ? full.products_included
                : p.products_included;

              return { ...p, images, image, products_included };
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

  // panier = prix remisé
  const addFromCard = (pack) => {
    const preview = collectImages(pack, 1)[0] || fallbackImg;
    const { discountedCents } = computePackPricing(allProducts, pack);
    const price_cents = discountedCents || Number(pack.price_cents || 0);

    add(
      {
        id: String(pack.id),
        name: pack.name,
        price_cents,
        image: preview,
        slug: pack.slug || null,
        brand: pack.brand || "Pack",
      },
      1
    );
  };

  if (err) {
    return (
      <section className="bestSellers">
        <div className="bs-header"><h1 className="bs-title">Packs routines</h1></div>
        <p style={{ color: "#c33", padding: 12 }}>{err}</p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="bestSellers">
        <div className="bs-header"><h1 className="bs-title">Packs routines</h1></div>
        <p style={{ padding: 12 }}>Chargement…</p>
      </section>
    );
  }

  if (!packs.length) {
    return (
      <section className="bestSellers">
        <div className="bs-header"><h1 className="bs-title">Packs routines</h1></div>
        <p style={{ padding: 12, color: "#666" }}>Aucun pack pour le moment.</p>
      </section>
    );
  }

  return (
    <section className="bestSellers" aria-labelledby="packs-title">
      <div className="bs-header">
        <h1 id="packs-title" className="bs-title">Packs routines</h1>
      </div>

      <div className="bs-rail-wrapper">
        <div className="bs-rail" role="list" aria-live="polite">
          {packs.map((pack, i) => {
            const slug = pack.slug || String(pack.id);
            const imgs = collectImages(pack, 2);
            const imgPrimary = imgs[0] || fallbackImg;
            const imgHover = imgs[1] || imgPrimary;
            const { detailSumCents, discountedCents } = computePackPricing(allProducts, pack);

            return (
              <article key={pack.id} className="bs-card" role="listitem" style={{ "--i": i }}>
                <Link className="thumb" to={`/pack/${slug}`} aria-label={`${pack.brand || "Pack"} ${pack.name}`}>
                  <img className="img primary" src={imgPrimary} alt={`${pack.brand || "Pack"} ${pack.name}`} loading="lazy" onError={(e) => { e.currentTarget.src = fallbackImg; }} />
                  <img className="img secondary" src={imgHover} alt="" loading="lazy" onError={(e) => { e.currentTarget.src = fallbackImg; }} />

                  {/* badge calculé */}
                  {detailSumCents > 0 && discountedCents > 0 && discountedCents < detailSumCents && (
                    <div style={{
                      position: "absolute", top: 8, left: 8,
                      background: "#111827", color: "#fff", fontSize: 12, fontWeight: 800,
                      padding: "4px 8px", borderRadius: 999, zIndex: 2,
                    }}>
                      -{Math.round((1 - discountedCents / detailSumCents) * 100)}%
                    </div>
                  )}

                  <button
                    className="addBtn"
                    type="button"
                    onClick={(e) => { e.preventDefault(); addFromCard(pack); }}
                    title="Ajouter au panier"
                  >
                    Ajouter au panier
                  </button>

                  <div className="bs-fav">
                    <FavoriteButton product={pack} size={22} className="bs-fav-btn" />
                  </div>
                </Link>

                <div className="meta">
                  <div className="brand">{pack.brand || "Pack"}</div>
                  <h3 className="name">{pack.name}</h3>

                  <div className="priceRow">
                    {/* prix remisé (gros) */}
                    <span className="pricee">{fmtEur.format((discountedCents || 0) / 100)}</span>
                    {/* prix au détail barré */}
                    {detailSumCents > 0 && discountedCents < detailSumCents && (
                      <s className="stock-hint">{fmtEur.format(detailSumCents / 100)}</s>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="bs-footer">
        <Link className="bs-more" to="/catalogue?cat=pack&catLabel=pack">
          Voir tous les packs
        </Link>
      </div>
    </section>
  );
}
