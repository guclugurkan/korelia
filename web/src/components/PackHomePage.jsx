// src/components/PackHomePage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./BestSellers.css"; // on réutilise le même CSS
import { useCart } from "../cart/CartContext";
import FavoriteButton from "../components/FavoriteButton";

const API = import.meta.env.VITE_API_URL || "http://localhost:4242";
const perPage = 4;

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

/** Résout un asset du dossier public/ en tenant compte du BASE_URL (prod sous sous-chemin) */
function publicAsset(p) {
  if (!p) return null;
  if (/^https?:\/\//i.test(p)) return p; // URL absolue -> on laisse
  const base = import.meta.env.BASE_URL || "/";
  const rel = String(p).replace(/^(\.\/|\.\.\/)+/, "").replace(/^\/+/, "");
  return (base.endsWith("/") ? base : base + "/") + rel; // ex: "/korelia/" + "img/..."
}

/** Récupère 1 ou 2 images en PRIORISANT p.images[] puis repli sur p.image */
function collectImages(entity, max = 2) {
  const out = [];
  if (Array.isArray(entity?.images)) out.push(...entity.images);
  if (entity?.image) out.push(entity.image);
  const uniq = Array.from(new Set(out.filter(Boolean).map(publicAsset)));
  return (uniq.length ? uniq : [fallbackImg]).slice(0, max);
}

export default function PackHomePage() {
  const [packs, setPacks] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(0);
  const [dir, setDir] = useState("next"); // "next" | "prev"

  const { add } = useCart();

  // Charge TOUS les produits puis garde seulement les packs, puis ENRICHIT (pour avoir au moins 2 images)
  useEffect(() => {
    (async () => {
      try {
        setErr("");
        setLoading(true);

        // 1) Liste brute
        const r = await fetch(`${API}/api/products`);
        if (!r.ok) throw new Error("API produits indisponible");
        const data = await r.json();

        const onlyPacks = (Array.isArray(data) ? data : []).filter(
          (p) => String(p.category || "").toLowerCase() === "pack"
        );

        // 2) Enrichissement: pour les packs n’ayant pas encore 2 images, on fetch les détails
        const enriched = await Promise.all(
          onlyPacks.map(async (p) => {
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

        setPacks(enriched);
      } catch (e) {
        setErr(e.message || "Erreur");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const pageCount = Math.max(1, Math.ceil(packs.length / perPage));
  const start = page * perPage;
  const visible = useMemo(() => packs.slice(start, start + perPage), [packs, start]);

  const prev = () => {
    setDir("prev");
    setPage((p) => (p - 1 + pageCount) % pageCount);
  };
  const next = () => {
    setDir("next");
    setPage((p) => (p + 1) % pageCount);
  };

  // Ajoute le pack au panier — image d’aperçu = première image résolue
  const addFromCard = (p) => {
    const preview = collectImages(p, 1)[0] || fallbackImg;
    const item = {
      id: String(p.id),
      name: p.name,
      price_cents: Number(p.price_cents || 0),
      image: preview,
      slug: p.slug || null,
      brand: p.brand || "Pack",
    };
    add(item, 1);
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
    <section
      className="bestSellers"
      aria-labelledby="packs-title"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") prev();
        if (e.key === "ArrowRight") next();
      }}
    >
      {/* Titre centré + barre dessous */}
      <div className="bs-header">
        <h1 id="packs-title" className="bs-title">Packs routines</h1>
      </div>

      {/* Scène avec flèches */}
      <div className="bs-stage">
        <button className="bs-arrow left" onClick={prev} aria-label="Packs précédents" type="button">‹</button>

        <div
          id="packs-grid"
          className="bs-grid"
          role="list"
          aria-live="polite"
          data-dir={dir}
          key={`${page}-${dir}`}
        >
          {visible.map((p, i) => {
            const slug = p.slug || String(p.id);
            const imgs = collectImages(p, 2);
            const imgPrimary = imgs[0] || fallbackImg;
            const imgHover = imgs[1] || imgPrimary;

            return (
              <article key={p.id} className="card" role="listitem" style={{ "--i": i }}>
                {/* Lien vers /pack/:slug */}
                <Link className="thumb" to={`/pack/${slug}`} aria-label={`${p.brand || "Pack"} ${p.name}`}>
                  {/* Image principale */}
                  <img
                    className="img primary"
                    src={imgPrimary}
                    alt={`${p.brand || "Pack"} ${p.name}`}
                    loading="lazy"
                    onError={(e) => { e.currentTarget.src = fallbackImg; }}
                  />
                  {/* Image au hover */}
                  <img
                    className="img secondary"
                    src={imgHover}
                    alt=""
                    loading="lazy"
                    onError={(e) => { e.currentTarget.src = fallbackImg; }}
                  />

                  {/* Badge -10% pack (visuel simple) */}
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
                      borderRadius: 999
                    }}
                  >
                    -10% pack
                  </div>

                  {/* bouton ajout panier */}
                  <button
                    className="addBtn"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      addFromCard(p);
                    }}
                  >
                    Ajouter au panier
                  </button>

                  {/* favoris */}
                  <div className="thumb-fav">
                    <FavoriteButton product={p} size={22} />
                  </div>
                </Link>

                <div className="meta">
                  <div className="brand">{p.brand || "Pack"}</div>
                  <h3 className="name">{p.name}</h3>
                  <div className="price">{(Number(p.price_cents || 0) / 100).toFixed(2)} €</div>
                </div>
              </article>
            );
          })}
        </div>

        <button className="bs-arrow right" onClick={next} aria-label="Packs suivants" type="button">›</button>
      </div>

      {/* Dots + CTA */}
      <div className="bs-footer">
        <div className="bs-dots" role="tablist" aria-label="Pages de packs">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              className={`dot ${i === page ? "is-active" : ""}`}
              aria-label={`Aller à la page ${i + 1}`}
              aria-selected={i === page}
              role="tab"
              onClick={() => { setDir(i > page ? "next" : "prev"); setPage(i); }}
            />
          ))}
        </div>
        <Link className="bs-more" to="/catalogue?cat=pack&catLabel=pack">Voir tous les packs</Link>
      </div>
    </section>
  );
}
