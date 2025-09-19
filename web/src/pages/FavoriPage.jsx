// src/pages/FavoriPage.jsx
import { Link } from "react-router-dom";
import { useFavorites } from "../favorites/FavoritesContext";
import { useCart } from "../cart/CartContext";
import HeaderAll from "../components/HeaderAll";
import Footer from "../components/Footer";
import "./Favoris.css";

const fmtEur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

/** Respecte BASE_URL (prod sous sous-chemin) pour tes assets du dossier public/ */
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

export default function FavoriPage() {
  // 🔒 Défensif: le contexte peut être undefined si pas de Provider
  const favCtx = useFavorites() || {};
  const favorites = Array.isArray(favCtx.favorites) ? favCtx.favorites : [];
  const remove = typeof favCtx.remove === "function" ? favCtx.remove : () => {};
  const clear = typeof favCtx.clear === "function" ? favCtx.clear : () => {};

  const { add } = useCart();

  const addToCart = (p) => {
    const item = {
      id: String(p.id),
      name: p.name,
      price_cents: Number(p.price_cents || 0),
      image: publicAsset(p.image) || fallbackImg,
      slug: p.slug || null,
      brand: p.brand || "",
    };
    add(item, 1);
  };

  return (
    <main className="fav-wrap">
      <HeaderAll />

      <section className="fav-container">
        <div className="fav-head">
          <div>
            <h1 className="fav-title">Mes favoris</h1>
            <p className="fav-sub">
              {favorites.length
                ? `${favorites.length} article${favorites.length > 1 ? "s" : ""} enregistré${
                    favorites.length > 1 ? "s" : ""
                  }.`
                : "Aucun favori pour le moment."}
            </p>
          </div>

          {favorites.length > 0 && (
            <div className="fav-actions">
              <Link to="/catalogue" className="btn-ghost">
                ← Continuer mes achats
              </Link>
              <button className="btn-danger" onClick={clear}>
                Retirer tout
              </button>
            </div>
          )}
        </div>

        {favorites.length === 0 ? (
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
            {favorites.map((f) => {
              const img = publicAsset(f.image) || fallbackImg;
              const slug = f.slug || String(f.id);

              return (
                <article key={f.id} className="fav-card" role="listitem">
                  <button
                    className="fav-remove"
                    onClick={() => remove(f.id)}
                    title="Retirer des favoris"
                    aria-label="Retirer des favoris"
                  >
                    ✕
                  </button>

                  <Link to={`/produit/${slug}`} className="fav-thumb" aria-label={`${f.brand || ""} ${f.name}`}>
                    <img
                      src={img}
                      alt={f.name}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = fallbackImg;
                      }}
                    />
                  </Link>

                  <div className="fav-meta">
                    {f.brand && <div className="brand">{f.brand}</div>}
                    <Link to={`/produit/${slug}`} className="name">
                      {f.name}
                    </Link>
                    <div className="price">{fmtEur.format(Number(f.price_cents || 0) / 100)}</div>
                  </div>

                  <div className="fav-cta">
                    <button className="btn-primary" onClick={() => addToCart(f)}>
                      Ajouter au panier
                    </button>
                    <Link className="btn-link" to={`/produit/${slug}`}>
                      Voir le produit
                    </Link>
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
