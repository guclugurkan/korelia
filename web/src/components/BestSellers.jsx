// src/components/BestSellers.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./BestSellers.css";
import { useCart } from "../cart/CartContext";
import FavoriteButton from "../components/FavoriteButton";

const API = import.meta.env.VITE_API_URL || "http://localhost:4242";
const perPage = 4;

/** <<< Choisis ici tes 16 best-sellers (slugs/ids) >>> */
const POPULAR_IDS = [
  "anua-heartleaf-77-soothing-toner",
  "anua-heartleaf-pore-control-cleansing-oil",
  "boj-relief-sun-rice-probiotics",
  "boj-revive-eye-serum-ginseng-retinal",
  "cosrx-advanced-snail-96-mucin-power-essence",
  "cosrx-aloe-soothing-sun-cream",
  "skin1004-madagascar-centella-ampoule",
  "skin1004-madagascar-centella-hyalu-cica-water-fit-sun-serum",
  "torriden-dive-in-low-molecular-hyaluronic-serum",
  "roundlab-birch-juice-moisturizing-toner",
  "iunik-tea-tree-relief-serum",
  "somebymi-aha-bha-pha-30days-miracle-toner",
  "laneige-lip-sleeping-mask-berry",
  "haruharu-black-rice-hyaluronic-toner",
  "mixsoon-bean-essence-50ml",
  "boj-ginseng-essence-water",
];

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

/** Récupère 1 ou 2 images en PRIORISANT p.images[] puis en repliant sur p.image */
function collectImages(entity, max = 2) {
  const out = [];
  if (Array.isArray(entity?.images)) out.push(...entity.images); // priorité au tableau complet
  if (entity?.image) out.push(entity.image);                     // secours: ancienne propriété
  const uniq = Array.from(new Set(out.filter(Boolean).map(publicAsset)));
  return (uniq.length ? uniq : [fallbackImg]).slice(0, max);
}

export default function BestSellers() {
  const [all, setAll] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(0);
  const [dir, setDir] = useState("next"); // "next" | "prev"

  const { add } = useCart();

  useEffect(() => {
    (async () => {
      try {
        setErr("");
        setLoading(true);

        // 1) Récupère la liste courte
        const r = await fetch(`${API}/api/products`);
        if (!r.ok) throw new Error("API produits indisponible");
        const data = await r.json();

        // 2) Filtre + ordre
        const baseArr = (Array.isArray(data) ? data : []).filter((p) => {
          const idOrSlug = String(p.slug || p.id || "");
          return POPULAR_IDS.includes(idOrSlug);
        });
        baseArr.sort((a, b) => {
          const ia = POPULAR_IDS.indexOf(String(a.slug || a.id || ""));
          const ib = POPULAR_IDS.indexOf(String(b.slug || b.id || ""));
          return ia - ib;
        });

        // 3) ENRICHISSEMENT : pour ceux qui n'ont pas au moins 2 images,
        //    on appelle /api/products/:slug pour récupérer images[0..]
        const enriched = await Promise.all(
          baseArr.map(async (p) => {
            const hasTwo = Array.isArray(p.images) && p.images.length >= 2;
            if (hasTwo) return p;

            try {
              const key = String(p.slug || p.id);
              const r2 = await fetch(`${API}/api/products/${key}`);
              if (!r2.ok) return p; // on garde tel quel si ça rate
              const full = await r2.json();

              const images = Array.isArray(full.images) ? full.images : p.images;
              const image = full.image ?? p.image;

              return { ...p, images, image };
            } catch {
              return p;
            }
          })
        );

        setAll(enriched);

        // DEBUG utile : voir ce que le front utilisera réellement
        // console.table(enriched.map(p => ({
        //   id: p.slug || p.id,
        //   primary: collectImages(p, 2)[0],
        //   hover: collectImages(p, 2)[1] ?? "(none)"
        // })));
      } catch (e) {
        setErr(e.message || "Erreur");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const pageCount = Math.max(1, Math.ceil(all.length / perPage));
  const start = page * perPage;
  const visible = useMemo(() => all.slice(start, start + perPage), [all, start]);

  const prev = () => {
    setDir("prev");
    setPage((p) => (p - 1 + pageCount) % pageCount);
  };
  const next = () => {
    setDir("next");
    setPage((p) => (p + 1) % pageCount);
  };

  // ajoute au panier (aperçu image = même logique que l'affichage)
  const addFromCard = (p) => {
    const preview = collectImages(p, 1)[0] || fallbackImg;
    const productForCart = {
      id: String(p.id),
      name: p.name,
      price_cents: Number(p.price_cents || 0),
      image: preview,
      slug: p.slug || null,
      brand: p.brand || "",
    };
    add(productForCart, 1);
  };

  if (err) {
    return (
      <section className="bestSellers">
        <div className="bs-header">
          <h1 className="bs-title">Best Sellers</h1>
        </div>
        <p style={{ color: "#c33", padding: 12 }}>{err}</p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="bestSellers">
        <div className="bs-header">
          <h1 className="bs-title">Best Sellers</h1>
        </div>
        <p style={{ padding: 12 }}>Chargement…</p>
      </section>
    );
  }

  if (!all.length) {
    return (
      <section className="bestSellers">
        <div className="bs-header">
          <h1 className="bs-title">Best Sellers</h1>
        </div>
        <p style={{ padding: 12, color: "#666" }}>Aucun produit disponible.</p>
      </section>
    );
  }

  return (
    <section
      className="bestSellers"
      aria-labelledby="bs-title"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") prev();
        if (e.key === "ArrowRight") next();
      }}
    >
      {/* Titre centré + barre noire dessous */}
      <div className="bs-header">
        <h1 id="bs-title" className="bs-title">
          Best Sellers
        </h1>
      </div>

      {/* Scène avec flèches gauche/droite */}
      <div className="bs-stage">
        <button className="bs-arrow left" onClick={prev} aria-label="Produits précédents" type="button">
          ‹
        </button>

        <div
          id="bs-grid"
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
                {/* Lien vers la fiche produit par slug */}
                <Link className="thumb" to={`/produit/${slug}`} aria-label={`${p.brand || ""} ${p.name}`}>
                  <img
                    className="img primary"
                    src={imgPrimary}
                    alt={`${p.brand || ""} ${p.name}`}
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

                  {/* bouton favoris (overlay) */}
                  <div className="thumb-fav">
                    <FavoriteButton product={p} size={22} />
                  </div>
                </Link>

                <div className="meta">
                  {p.brand && <div className="brand">{p.brand}</div>}
                  <h3 className="name">{p.name}</h3>
                  <div className="price">{(Number(p.price_cents || 0) / 100).toFixed(2)} €</div>
                </div>
              </article>
            );
          })}
        </div>

        <button className="bs-arrow right" onClick={next} aria-label="Produits suivants" type="button">
          ›
        </button>
      </div>

      {/* Dots + CTA */}
      <div className="bs-footer">
        <div className="bs-dots" role="tablist" aria-label="Pages">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              className={`dot ${i === page ? "is-active" : ""}`}
              aria-label={`Aller à la page ${i + 1}`}
              aria-selected={i === page}
              role="tab"
              onClick={() => {
                setDir(i > page ? "next" : "prev");
                setPage(i);
              }}
            />
          ))}
        </div>
        <Link className="bs-more" to="/catalogue">
          Voir tous les produits
        </Link>
      </div>
    </section>
  );
}
