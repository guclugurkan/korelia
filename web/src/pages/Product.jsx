// src/pages/Product.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import HeaderAll from "../components/HeaderAll";
import Footer from "../components/Footer";
import { useCart } from "../cart/CartContext";
import { useAuth } from "../auth/AuthContext";
import { useFavorites } from "../favorites/FavoritesContext";
import "./Product.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:4242";
const fmtEur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

const fallbackImg =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='800'>
      <rect width='100%' height='100%' fill='#f3f4f6'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#9ca3af' font-family='system-ui,Segoe UI,Roboto,Arial' font-size='20'>
        Image indisponible
      </text>
    </svg>`
  );

/** Résout un asset du dossier public/ en tenant compte du BASE_URL (prod sous sous-chemin) */
function publicAsset(p) {
  if (!p) return null;
  if (/^https?:\/\//i.test(p)) return p; // absolu => on laisse
  const base = import.meta.env.BASE_URL || "/";
  const rel = String(p).replace(/^(\.\/|\.\.\/)+/, "").replace(/^\/+/, ""); // nettoie "./", "../" et "/" de tête
  return (base.endsWith("/") ? base : base + "/") + rel; // ex: "/korelia/" + "img/..."
}

/** Récupère jusqu'à N images en PRIORISANT p.images[] puis repli sur p.image */
function collectImages(entity, max = 5) {
  const out = [];
  if (Array.isArray(entity?.images)) out.push(...entity.images);
  if (entity?.image) out.push(entity.image);
  const uniq = Array.from(new Set(out.filter(Boolean).map(publicAsset)));
  return (uniq.length ? uniq : [fallbackImg]).slice(0, max);
}

export default function Product() {
  const { slug } = useParams();
  const { add } = useCart();
  const { user, addReviewPoints } = useAuth();
  const { has: isFav, toggle: toggleFav } = useFavorites();

  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [qty, setQty] = useState(1);

  // Avis
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [reviewMsg, setReviewMsg] = useState("");

  // Galerie
  const [idx, setIdx] = useState(0);
  const changeIdx = useCallback((i) => setIdx(i), []);
  const nextImg = useCallback((len) => setIdx((i) => (i + 1) % len), []);
  const prevImg = useCallback((len) => setIdx((i) => (i - 1 + len) % len), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setErr(""); setLoading(true);
        const r = await fetch(`${API}/api/products/${slug}`, { headers: { Accept: "application/json" } });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error || "Produit introuvable");
        if (!cancelled) {
          setP(data);
          setIdx(0); // reset la galerie au changement de produit
        }
      } catch (e) {
        if (!cancelled) setErr(e.message || "Erreur");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  const gallery = useMemo(() => collectImages(p, 5), [p]);

  const inStock = useMemo(() => {
    if (!p) return false;
    return typeof p.stock === "number" ? p.stock > 0 : true;
  }, [p]);

  const earnedPoints = useMemo(() => {
    if (!p) return 0;
    return Math.floor((p.price_cents || 0) / 100); // 1 point/€
  }, [p]);

  const addToCart = () => {
    if (!p) return;
    add({
      id: String(p.id),
      name: p.name,
      brand: p.brand,
      image: gallery[idx] || gallery[0] || fallbackImg, // image visible au moment de l'ajout
      slug: p.slug,
      price_cents: p.price_cents,
      qty: Math.max(1, Math.min(99, Number(qty) || 1)),
    });
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setReviewMsg("");
    try {
      await addReviewPoints({ productId: String(p.id), rating, content });
      setReviewMsg("Merci ! Tes points ont été ajoutés (si éligible).");
      setContent("");
      setRating(5);
    } catch (ex) {
      setReviewMsg(ex.message || "Impossible d’envoyer l’avis");
    }
  };

  if (loading) return (<main><HeaderAll/><div style={{ padding: 24 }}>Chargement…</div><Footer/></main>);
  if (err) return (<main><HeaderAll/><div style={{ padding: 24 }}><p style={{ color: "#c33" }}>{err}</p></div><Footer/></main>);
  if (!p) return (<main><HeaderAll/><Footer/></main>);

  const fav = isFav(p.id);
  const mainImg = gallery[idx] || fallbackImg;

  return (
    <main style={{ background: "#fff" }} className="product-container">
      <HeaderAll />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)",
            gap: 24,
          }}
        >
          {/* ===== VISUEL + GALERIE ===== */}
          <div style={{ position: "relative" }}>
            {/* Image principale */}
            <div
              style={{
                border: "1px solid #eee",
                borderRadius: 14,
                overflow: "hidden",
                boxShadow: "0 10px 30px rgba(0,0,0,.05)",
                background: "#f9fafb",
                position: "relative",
              }}
            >
              <img
                src={mainImg}
                alt={`${p.brand ? p.brand + " " : ""}${p.name} — visuel ${idx + 1}`}
                onError={(e) => (e.currentTarget.src = fallbackImg)}
                style={{ width: "100%", display: "block", aspectRatio: "1/1", objectFit: "cover" }}
              />

              {/* Flèches galerie */}
              {gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Image précédente"
                    onClick={() => prevImg(gallery.length)}
                    style={arrowBtnStyle("left")}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    aria-label="Image suivante"
                    onClick={() => nextImg(gallery.length)}
                    style={arrowBtnStyle("right")}
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            {/* Bouton favoris */}
            <button
              type="button"
              aria-pressed={fav}
              aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
              title={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
              onClick={() => toggleFav(p.id)}
              style={{
                position: "absolute",
                right: 12,
                top: 12,
                width: 40,
                height: 40,
                borderRadius: 999,
                border: "1px solid #e5e7eb",
                background: fav ? "#fff5f5" : "#ffffffd9",
                color: fav ? "#ef4444" : "#9ca3af",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                boxShadow: "0 6px 16px rgba(0,0,0,.08)",
                backdropFilter: "blur(2px)",
              }}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path
                  d="M12 21s-6.716-4.35-9.428-7.062C.86 12.226 1 9.5 3.2 7.8A5 5 0 0 1 12 8a5 5 0 0 1 8.8-.2c2.2 1.7 2.34 4.427.628 6.138C18.716 16.65 12 21 12 21z"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </svg>
            </button>

            {/* Vignettes */}
            <div
              style={{
                marginTop: 10,
                display: "grid",
                gridTemplateColumns: `repeat(${Math.min(gallery.length, 5)}, 1fr)`,
                gap: 10,
              }}
            >
              {gallery.map((src, i) => {
                const active = i === idx;
                return (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Voir image ${i + 1}`}
                    aria-current={active}
                    onClick={() => changeIdx(i)}
                    style={{
                      padding: 0,
                      borderRadius: 10,
                      overflow: "hidden",
                      border: active ? "2px solid #111827" : "1px solid #e5e7eb",
                      outline: "none",
                      cursor: "pointer",
                      background: "#fff",
                    }}
                  >
                    <img
                      src={src}
                      alt={`Vignette ${i + 1}`}
                      onError={(e) => (e.currentTarget.src = fallbackImg)}
                      style={{ width: "100%", display: "block", aspectRatio: "1/1", objectFit: "cover" }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* ===== META / ACHAT ===== */}
          <div>
            {p.brand && (
              <div style={{ color: "#6b7280", fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase" }}>
                {p.brand}
              </div>
            )}
            <h1 style={{ margin: "6px 0 12px", lineHeight: 1.2 }}>{p.name}</h1>

            {/* Prix + badge stock */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 26, fontWeight: 800 }}>
                {fmtEur.format((p.price_cents || 0) / 100)}
              </div>
              <div>
                {inStock ? (
                  <span style={badge(true)}>En stock</span>
                ) : (
                  <span style={badge(false)}>Épuisé</span>
                )}
              </div>
            </div>

            {/* Type (catégorie) */}
            {p.category && (
              <div style={{ margin: "6px 0 10px" }}>
                <span style={tagStyle}>Type : {p.category}</span>
              </div>
            )}

            {/* Types de peau */}
            {Array.isArray(p.skin_types) && p.skin_types.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "10px 0 14px" }}>
                {p.skin_types.map((t) => (
                  <span key={t} style={chipStyle}>{t}</span>
                ))}
              </div>
            )}

            {/* Points fidélité */}
            <div
              style={{
                marginTop: 4,
                color: "#065f46",
                background: "#ecfdf5",
                padding: "10px 12px",
                borderRadius: 10,
                fontWeight: 600,
              }}
            >
              💎 À l’achat : <b>{earnedPoints} point{earnedPoints > 1 ? "s" : ""}</b>
            </div>

            {/* Achat */}
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 16 }}>
              <input
                type="number"
                min={1}
                max={99}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                style={{
                  width: 90,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #e5e7eb",
                }}
                aria-label="Quantité"
              />
              <button
                onClick={addToCart}
                disabled={!inStock}
                style={{
                  padding: "12px 16px",
                  background: inStock ? "#111827" : "#9ca3af",
                  color: "#fff",
                  border: 0,
                  borderRadius: 10,
                  fontWeight: 700,
                  cursor: inStock ? "pointer" : "not-allowed",
                  boxShadow: "0 8px 18px rgba(17,24,39,.18)",
                }}
              >
                Ajouter au panier
              </button>
            </div>

            {/* Description / Détails */}
            {p.description && (
              <section style={{ marginTop: 18 }}>
                <h2 style={h2Style}>Description</h2>
                <p style={{ lineHeight: 1.6, color: "#374151" }}>{p.description}</p>
              </section>
            )}

            {(Array.isArray(p.highlights) && p.highlights.length > 0) && (
              <section style={{ marginTop: 16 }}>
                <h2 style={h2Style}>Points forts</h2>
                <ul style={{ paddingLeft: 18, color: "#374151", lineHeight: 1.6 }}>
                  {p.highlights.map((h, i) => <li key={i}>{h}</li>)}
                </ul>
              </section>
            )}

            <section style={{ marginTop: 16 }}>
              <h2 style={h2Style}>Caractéristiques</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, color: "#374151" }}>
                {p.category && <Field k="Type" v={p.category} />}
                {Array.isArray(p.skin_types) && p.skin_types.length > 0 && (
                  <Field k="Peaux" v={p.skin_types.join(", ")} />
                )}
                {p.volume_ml && <Field k="Contenance" v={`${p.volume_ml} ml`} />}
                {p.made_in && <Field k="Origine" v={p.made_in} />}
              </div>
            </section>

            {(p.how_to_use || p.ingredients) && (
              <section style={{ marginTop: 16 }}>
                {p.how_to_use && (
                  <>
                    <h2 style={h2Style}>Conseils d’utilisation</h2>
                    {Array.isArray(p.how_to_use) ? (
                      <ul style={{ paddingLeft: 18, color: "#374151", lineHeight: 1.6 }}>
                        {p.how_to_use.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    ) : (
                      <p style={{ color: "#374151", lineHeight: 1.6 }}>{p.how_to_use}</p>
                    )}
                  </>
                )}
                {p.ingredients && (
                  <>
                    <h2 style={{ ...h2Style, marginTop: 12 }}>Ingrédients</h2>
                    <p style={{ color: "#374151", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{p.ingredients}</p>
                  </>
                )}
              </section>
            )}
          </div>
        </div>

        {/* Avis : démo (crédite +10 pts via /reviews/add) */}
        <section style={{ marginTop: 32 }}>
          <h2 style={h2Style}>Laisser un avis</h2>
          {!user ? (
            <p style={{ color: "#6b7280" }}>Connecte-toi pour laisser un avis et gagner des points.</p>
          ) : (
            <form onSubmit={submitReview} style={{ display: "grid", gap: 10, maxWidth: 560 }}>
              <label>
                Note :
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  style={{ marginLeft: 8 }}
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>{n} ★</option>
                  ))}
                </select>
              </label>

              <textarea
                rows={4}
                placeholder="Ton avis (facultatif)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{ padding: 10, borderRadius: 8, border: "1px solid #e5e7eb" }}
              />

              <div>
                <button
                  type="submit"
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: 0,
                    background: "#111827",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Envoyer l’avis (+10 pts)
                </button>
                {reviewMsg && <span style={{ marginLeft: 10, color: "#065f46" }}>{reviewMsg}</span>}
              </div>

              <p style={{ color: "#6b7280", marginTop: 6, fontSize: 13 }}>
                Anti-abus : 1 avis / produit / 24h.
              </p>
            </form>
          )}
        </section>
      </div>

      <Footer />
    </main>
  );
}

/* ==== Petits composants / styles utilitaires ==== */
function Field({ k, v }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 6 }}>
      <div style={{ color: "#6b7280" }}>{k}</div>
      <div>{v}</div>
    </div>
  );
}

function badge(ok) {
  return {
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    color: ok ? "#065f46" : "#7f1d1d",
    background: ok ? "#d1fae5" : "#fee2e2",
    border: `1px solid ${ok ? "#a7f3d0" : "#fecaca"}`,
  };
}

const h2Style = { fontSize: 18, fontWeight: 800, margin: "16px 0 8px" };

const chipStyle = {
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: 999,
  background: "#f3f4f6",
  color: "#374151",
  fontWeight: 700,
  fontSize: 12,
};

const tagStyle = {
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: 8,
  background: "#eef2ff",
  color: "#3730a3",
  fontWeight: 700,
  fontSize: 12,
};

function arrowBtnStyle(side) {
  return {
    position: "absolute",
    top: "50%",
    [side]: 8,
    transform: "translateY(-50%)",
    width: 36,
    height: 36,
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,.12)",
    background: "rgba(255,255,255,.92)",
    display: "grid",
    placeItems: "center",
    fontSize: 18,
    cursor: "pointer",
    boxShadow: "0 8px 16px rgba(0,0,0,.12)",
  };
}
