// src/pages/Product.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";

import SiteHeader from "../components/SiteHeader"
import Footer from "../components/Footer";
import { useCart } from "../cart/CartContext";
import { useAuth } from "../auth/AuthContext";
import "./product.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:4242";
const fmtEur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

const skinTypeLabel = (st) => {
  const map = {
    seche: "sèche",
    grasse: "grasse",
    mixte: "mixte",
    sensible: "sensible",
    normale: "normale",
    "très sèche": "très sèche",
    "très sensible": "très sensible",
    tous: "tous types",
  };
  return map[st?.toLowerCase?.()] || st;
};

export default function Product() {
  const { slug } = useParams();
  const { add } = useCart();

  // Auth (avis)
  const {
    user,
    listProductReviews: _listProductReviews,
    submitProductReview: _submitProductReview,
  } = useAuth();

  const listProductReviews =
    _listProductReviews ||
    (async (productId) => {
      const r = await fetch(`${API}/reviews/by-product/${encodeURIComponent(productId)}`, {
        credentials: "include",
      });
      const data = await r.json().catch(() => []);
      if (!r.ok) throw new Error(data.error || "Impossible de charger les avis");
      return data;
    });

  const submitProductReview =
    _submitProductReview ||
    (async (payload) => {
      const r = await fetch(`${API}/reviews/submit`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Impossible d’envoyer l’avis");
      return data;
    });

  // ====== State produit ======
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [mainImg, setMainImg] = useState(null);

  // Accordéons
  const [active, setActive] = useState({
    desc: true,
    how: true,
    inci: false,
    skinrec: true,
  });

  // Feedback “ajouté au panier”
  const [addedOk, setAddedOk] = useState(false);

  // ====== State avis ======
  const [reviews, setReviews] = useState([]);
  const [revLoading, setRevLoading] = useState(true);
  const [revErr, setRevErr] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sentMsg, setSentMsg] = useState("");

  // ====== Chargement du produit ======
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/api/products/${slug}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data = await res.json();
        if (mounted) setProduct(data);
      } catch (e) {
        console.error(e);
        if (mounted) setProduct(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [slug]);

  // Images
  const images = useMemo(() => {
    if (!product) return ["/img/placeholder.png"];
    const list = Array.isArray(product.images) && product.images.length ? product.images : [];
    return list.length ? list : [product.image || "/img/placeholder.png"];
  }, [product]);

  useEffect(() => {
    setMainImg(images?.[0] || null);
  }, [JSON.stringify(images)]);

  // Charger les avis
  useEffect(() => {
    if (!product?.id) {
      setReviews([]);
      setRevLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setRevErr("");
        setRevLoading(true);
        const data = await listProductReviews(String(product.id));
        if (!cancelled) setReviews(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) {
          setRevErr(e.message || "Impossible de charger les avis");
          setReviews([]);
        }
      } finally {
        if (!cancelled) setRevLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [product?.id, listProductReviews]);

  // Pré-remplir nom/email si connecté
  useEffect(() => {
    if (user) {
      setAuthorName(user.name || "");
      setAuthorEmail(user.email || "");
    } else {
      setAuthorName("");
      setAuthorEmail("");
    }
  }, [user]);

  const stock = Number.isFinite(product?.stock) ? product.stock : null;
  const inStock = stock === null ? true : stock > 0;
  const lowStockMsg = stock === 1 ? "Plus que 1 en stock" : stock === 2 ? "Plus que 2 en stock" : null;

  // Clamp quantité au stock
  useEffect(() => {
    if (stock !== null) setQty((q) => Math.max(1, Math.min(q, Math.max(1, stock))));
  }, [stock]);

  // Empêcher + au-delà du stock
  const canInc = stock === null ? true : qty < stock;

  const points = Math.max(1, Math.floor((product?.price_cents || 0) / 100));

  // ====== Données enrichies depuis le nouveau JSON ======
  const descSummary = product?.description?.summary || "";
  const descDetailed = product?.description?.detailed || "";

  const useSummary = product?.how_to_use?.summary || "";
  const useSteps = Array.isArray(product?.how_to_use?.steps) ? product.how_to_use.steps : [];
  const usePrecautions = Array.isArray(product?.how_to_use?.precautions)
    ? product.how_to_use.precautions
    : [];

  const inciList = Array.isArray(product?.ingredients?.list) ? product.ingredients.list : [];
  const keyRoles =
    product?.ingredients?.key_ingredients_roles && typeof product.ingredients.key_ingredients_roles === "object"
      ? product.ingredients.key_ingredients_roles
      : {};

  const benefits = Array.isArray(product?.benefits) ? product.benefits : [];

  const skinRec = product?.skin_types_recommendation || {};
  const recFor = Array.isArray(skinRec.recommended_for) ? skinRec.recommended_for : [];
  const cautionFor = Array.isArray(skinRec.use_with_caution) ? skinRec.use_with_caution : [];

  // ====== ADD TO CART handler ======
  function handleAddToCart() {
    if (!product) return;
    if (!inStock) return;

    const preview =
      mainImg ||
      (Array.isArray(product.images) && product.images[0]) ||
      product.image ||
      "/img/placeholder.png";

    const item = {
      id: String(product.id),
      name: product.name,
      price_cents: Number(product.price_cents || 0),
      image: preview,
      slug: product.slug || slug,
      brand: product.brand || "",
    };

    add(item, qty);
    setAddedOk(true);
    setTimeout(() => setAddedOk(false), 1500);
  }

  return (
    <>
      <div className="product-big-container">
        <SiteHeader/>

        <main className="product-container">
          <div className="back-row">
            <Link to="/catalogue" className="btn-back">← Retour au catalogue</Link>
          </div>

          {loading && <div className="product-loading">Chargement du produit…</div>}
          {!loading && !product && <div className="product-notfound">Produit introuvable.</div>}

          {!loading && product && (
            <>
              <div className="product-wrapper">
                {/* Galerie */}
                <section className="product-gallery">
                  <div className="product-main-image">
                    {mainImg ? <img src={mainImg} alt={product.name} /> : <div style={{ height: 300 }} />}
                    {!inStock && (
                      <div className="oos-over">
                        <span>Victime de succès</span>
                      </div>
                    )}
                  </div>

                  {images.length > 1 && (
                    <div className="product-thumbs">
                      {images.map((src, i) => (
                        <button
                          key={i}
                          className={`thumb ${src === mainImg ? "active" : ""}`}
                          onClick={() => setMainImg(src)}
                          aria-label={`Voir l’image ${i + 1}`}
                        >
                          <img src={src} alt={`thumb-${i + 1}`} />
                        </button>
                      ))}
                    </div>
                  )}
                </section>

                {/* Infos / Achat */}
                <section className="product-info">
                  <div className="pi-header">
                    {product.brand && <div className="pi-brand">{product.brand}</div>}
                    <h1 className="pi-name">{product.name}</h1>
                    {lowStockMsg && <div className="low-stock-pill">{lowStockMsg}</div>}
                  </div>

                  {benefits.length > 0 && (
                    <div className="pi-benefits">
                      <div className="pi-benefits-title">Avantages clés</div>
                      <ul className="pi-benefits-list">
                        {benefits.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pi-purchase">
                    <div className="qty-row">
                      <label htmlFor="qty">Quantité</label>
                      <div className="qty-controls">
                        <button
                          type="button"
                          onClick={() => setQty((q) => Math.max(1, q - 1))}
                          aria-label="Diminuer"
                        >
                          −
                        </button>
                        <input
                          id="qty"
                          type="number"
                          min="1"
                          value={qty}
                          onChange={(e) => {
                            const v = Math.max(1, parseInt(e.target.value || "1", 10));
                            setQty(stock === null ? v : Math.min(v, Math.max(1, stock)));
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => canInc && setQty((q) => q + 1)}
                          disabled={!canInc}
                          aria-label="Augmenter"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="price-row">
                      <span className={`price ${addedOk ? "pulse" : ""}`}>
                        {fmtEur.format((product.price_cents || 0) / 100)}
                      </span>
                      <button
                        className={`btn-primarya ${addedOk ? "ok" : ""}`}
                        disabled={!inStock}
                        onClick={handleAddToCart}
                        aria-live="polite"
                        title={inStock ? "Ajouter au panier" : "Rupture de stock"}
                      >
                        {inStock ? (addedOk ? "Ajouté ✓" : "Ajouter au panier") : "Rupture"}
                      </button>

                      <div className={`cart-toast ${addedOk ? "show" : ""}`} role="status" aria-live="polite">
                        Produit ajouté au panier ✓
                      </div>
                    </div>

                    <div className="pi-points-block">
                      À l’achat : <strong>{points}</strong> points gagnés
                    </div>
                  </div>
                </section>
              </div>

              {/* ====== Sections riches ====== */}
              <section className="product-sections">

                {/* Description — résumé + détaillé */}
                <div className="pi-section">
                  <div
                    className="acc-head"
                    onClick={() => setActive((s) => ({ ...s, desc: !s.desc }))}
                    role="button"
                    aria-expanded={active.desc}
                    tabIndex={0}
                  >
                    <h2>Description & Bénéfices</h2>
                    <span className={`chev ${active.desc ? "open" : ""}`}>⌄</span>
                  </div>
                  {active.desc && (
                    <div className="acc-body">
                      {descSummary && (
                        <div className="box block">
                          <div className="box-title">En bref</div>
                          <p className="box-text">{descSummary}</p>
                        </div>
                      )}
                      {descDetailed && (
                        <div className="box block">
                          <div className="box-title">En profondeur</div>
                          <p className="box-text">{descDetailed}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Utilisation — résumé + étapes + précautions */}
                <div className="pi-section">
                  <div
                    className="acc-head"
                    onClick={() => setActive((s) => ({ ...s, how: !s.how }))}
                    role="button"
                    aria-expanded={active.how}
                    tabIndex={0}
                  >
                    <h2>Utilisation</h2>
                    <span className={`chev ${active.how ? "open" : ""}`}>⌄</span>
                  </div>
                  {active.how && (
                    <div className="acc-body">
                      {useSummary && (
                        <div className="box block">
                          <div className="box-title">Essentiel</div>
                          <p className="box-text">{useSummary}</p>
                        </div>
                      )}

                      {useSteps.length > 0 && (
                        <div className="box block">
                          <div className="box-title">Étapes</div>
                          <ol className="steps">
                            {useSteps.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {usePrecautions.length > 0 && (
                        <div className="box block warn">
                          <div className="box-title">Précautions</div>
                          <ul className="list">
                            {usePrecautions.map((p, i) => (
                              <li key={i}>{p}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Ingrédients — clés + INCI complet */}
                <div className="pi-section">
                  <div
                    className="acc-head"
                    onClick={() => setActive((s) => ({ ...s, inci: !s.inci }))}
                    role="button"
                    aria-expanded={active.inci}
                    tabIndex={0}
                  >
                    <h2>Ingrédients</h2>
                    <span className={`chev ${active.inci ? "open" : ""}`}>⌄</span>
                  </div>
                  {active.inci && (
                    <div className="acc-body">
                      {/* Ingrédients clés */}
                      {Object.keys(keyRoles).length > 0 && (
                        <div className="key-ingredients">
                          {Object.entries(keyRoles).map(([name, role]) => (
                            <div className="key-card" key={name}>
                              <div className="key-name">{name}</div>
                              <div className="key-role">{String(role)}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Liste INCI complète */}
                      {inciList.length > 0 && (
                        <div className="box block">
                          <div className="box-title">INCI complet</div>
                          <p className="box-text">
                            {inciList.join(", ")}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Recommandations par type de peau */}
                {(recFor.length > 0 || cautionFor.length > 0) && (
                  <div className="pi-section">
                    <div
                      className="acc-head"
                      onClick={() => setActive((s) => ({ ...s, skinrec: !s.skinrec }))}
                      role="button"
                      aria-expanded={active.skinrec}
                      tabIndex={0}
                    >
                      <h2>Compatibilité peau</h2>
                      <span className={`chev ${active.skinrec ? "open" : ""}`}>⌄</span>
                    </div>
                    {active.skinrec && (
                      <div className="acc-body">
                        {recFor.length > 0 && (
                          <div className="box block">
                            <div className="box-title">Recommandé pour</div>
                            <div className="rec-grid">
                              {recFor.map((r, i) => (
                                <div className="rec-card ok" key={i}>
                                  <div className="rec-type">{skinTypeLabel(r.type || r.Type || "")}</div>
                                  <div className="rec-reason">{r.reason || r.Raison || ""}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {cautionFor.length > 0 && (
                          <div className="box block warn">
                            <div className="box-title">À utiliser avec précaution</div>
                            <div className="rec-grid">
                              {cautionFor.map((r, i) => (
                                <div className="rec-card warn" key={i}>
                                  <div className="rec-type">{skinTypeLabel(r.type || r.Type || "")}</div>
                                  <div className="rec-reason">{r.reason || r.Raison || ""}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* ====== AVIS ====== */}
              <section className="reviews">
                <div className="reviews-head">
                  <h2 className="reviews-title">Avis</h2>
                  <button className="btn-ghost" onClick={() => setFormOpen((o) => !o)} type="button">
                    {formOpen ? "Fermer" : "Laisser un avis"}
                  </button>
                </div>

                {formOpen && (
                  <form
                    className="review-form"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      try {
                        setSending(true);
                        setSentMsg("");
                        setRevErr("");

                        const payload = {
                          productId: String(product.id),
                          rating: Number(rating),
                          content: text,
                          authorName: authorName.trim(),
                          authorEmail: authorEmail.trim(),
                        };
                        if (!payload.authorName || !payload.authorEmail) {
                          throw new Error("Nom et email sont requis.");
                        }

                        await submitProductReview(payload);
                        setSentMsg("Merci ! Votre avis sera publié après validation.");
                        setText("");
                        setRating(5);
                        if (!user) {
                          setAuthorName("");
                          setAuthorEmail("");
                        } else {
                          setAuthorName(user.name || "");
                          setAuthorEmail(user.email || "");
                        }
                        setFormOpen(false);
                      } catch (err) {
                        setRevErr(err.message || "Impossible d’envoyer l’avis");
                      } finally {
                        setSending(false);
                      }
                    }}
                  >
                    <div className="rf-row two">
                      <label>
                        <span>Nom à afficher</span>
                        <input
                          value={authorName}
                          onChange={(e) => setAuthorName(e.target.value)}
                          placeholder="Ex: Marie D."
                          required
                        />
                      </label>
                      <label>
                        <span>Email</span>
                        <input
                          type="email"
                          value={authorEmail}
                          onChange={(e) => setAuthorEmail(e.target.value)}
                          required
                          readOnly={!!user}
                        />
                      </label>
                    </div>

                    <div className="rf-row">
                      <label>
                        <span>Note</span>
                        <div className="stars">
                          {[5, 4, 3, 2, 1].map((v) => (
                            <label key={v} className={`star ${rating >= v ? "on" : ""}`}>
                              <input
                                type="radio"
                                name="rating"
                                value={v}
                                checked={rating === v}
                                onChange={() => setRating(v)}
                              />
                              <span>★</span>
                            </label>
                          ))}
                        </div>
                      </label>
                    </div>

                    <div className="rf-row">
                      <label>
                        <span>Votre avis</span>
                        <textarea
                          rows={4}
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          placeholder="Partage ton expérience…"
                          required
                        />
                      </label>
                    </div>

                    <div className="rf-actions">
                      <button className="btn-primarya" type="submit" disabled={sending}>
                        {sending ? "Envoi…" : "Envoyer"}
                      </button>
                      <div className="rf-hint">
                        Les avis sont publiés après validation.<br />
                        10 pts sont crédités une seule fois aux acheteurs vérifiés.
                      </div>
                    </div>
                  </form>
                )}

                {revErr && <p className="acc-alert error" style={{ marginTop: 8 }}>{revErr}</p>}
                {sentMsg && <p className="acc-alert ok" style={{ marginTop: 8 }}>{sentMsg}</p>}

                <div className="reviews-list">
                  {revLoading ? (
                    <p>Chargement des avis…</p>
                  ) : reviews.length === 0 ? (
                    <p className="muted">Aucun avis pour l’instant.</p>
                  ) : (
                    reviews.map((r) => (
                      <article key={r.id} className="review-item">
                        <div className="ri-head">
                          <div className="ri-author">
                            <div className="ri-avatar">{(r.authorName || "C")[0].toUpperCase()}</div>
                            <div>
                              <div className="ri-name">{r.authorName || "Client"}</div>
                              <div className="ri-when">
                                {new Date(r.createdAt).toLocaleDateString("fr-BE")}
                              </div>
                            </div>
                          </div>
                          <div className="ri-right">
                            <div className="ri-stars" aria-label={`${r.rating} sur 5`}>
                              {"★★★★★".slice(0, r.rating)}
                              <span className="ri-dim">{"★★★★★".slice(r.rating)}</span>
                            </div>
                            {r.verifiedPurchase && <span className="ri-badge">Achat vérifié</span>}
                          </div>
                        </div>
                        <p className="ri-text">{r.content}</p>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
}
