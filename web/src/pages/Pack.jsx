// src/pages/Pack.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useParams,useLocation } from "react-router-dom";

import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import { useCart } from "../cart/CartContext";
import "./Pack.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:4242";
const fmtEur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

const fallbackImg =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='800'>
      <rect width='100%' height='100%' fill='#f3f4f6'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#9ca3af' font-family='system-ui,Segoe UI,Roboto,Arial' font-size='18'>
        Image indisponible
      </text>
    </svg>`
  );

// Assure un chemin public correct (gère "/", "./", etc.)
function normalizeImgPath(p) {
  if (!p) return null;
  if (/^https?:\/\//i.test(p)) return p;
  const rel = p.replace(/^(\.\/|\.\.\/)+/, "").replace(/^\/+/, "");
  const base = import.meta.env.BASE_URL || "/";
  const root = base.endsWith("/") ? base : base + "/";
  return root + rel;
}

export default function Pack() {
  const { slug } = useParams();
  const { add } = useCart();
  const location = useLocation();
  const backHref = `/catalogue${location.search || ""}`;
  const withQuery = (path)=> (location.search ? `${path}${location.search}` : path);

  // Données
  const [pack, setPack] = useState(null);
  const [allProducts, setAllProducts] = useState([]);

  // UI
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Galerie
  const [mainImg, setMainImg] = useState(null);

  // Achat
  const [qty, setQty] = useState(1);
  const [addedOk, setAddedOk] = useState(false);

  // ====== Chargement pack + catalogue (pour récupérer les produits inclus) ======
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setErr("");
        setLoading(true);

        // pack
        const rp = await fetch(`${API}/api/products/${slug}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        const dataPack = await rp.json().catch(() => ({}));
        if (!rp.ok) throw new Error(dataPack.error || "Pack introuvable");
        if (!mounted) return;
        setPack(dataPack);

        // catalogue complet (pour retrouver les produits inclus + images[0])
        const ra = await fetch(`${API}/api/products`, {
          headers: { Accept: "application/json" },
        });
        const dataAll = await ra.json().catch(() => []);
        if (!ra.ok) throw new Error("Produits indisponibles");
        if (!mounted) return;

        // Enrichit au besoin les produits (si certains n'ont pas images[])
        const arr = Array.isArray(dataAll) ? dataAll : [];
        const enriched = await Promise.all(
          arr.map(async (p) => {
            const hasImages = Array.isArray(p.images) && p.images.length > 0;
            if (hasImages) return p;
            try {
              const key = String(p.slug || p.id);
              const full = await (await fetch(`${API}/api/products/${key}`)).json();
              return {
                ...p,
                images: Array.isArray(full.images) ? full.images : p.images,
                image: full.image ?? p.image,
              };
            } catch {
              return p;
            }
          })
        );

        setAllProducts(enriched);
      } catch (e) {
        if (mounted) setErr(e.message || "Erreur");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [slug]);

  // ====== Galerie principale ======
  const images = useMemo(() => {
    const imgs = [];
    if (Array.isArray(pack?.images) && pack.images.length) {
      for (const p of pack.images) imgs.push(normalizeImgPath(p) || fallbackImg);
    } else if (pack?.image) {
      imgs.push(normalizeImgPath(pack.image) || fallbackImg);
    }
    if (!imgs.length) imgs.push(fallbackImg);
    return imgs;
  }, [pack]);

  useEffect(() => {
    setMainImg(images?.[0] || null);
  }, [JSON.stringify(images)]);

  // ====== Contenu du pack (match id/slug) ======
  const included = useMemo(() => {
    if (!pack || !Array.isArray(pack.products_included)) return [];
    const keys = new Set(pack.products_included.map(String));
    return allProducts.filter(
      (p) => keys.has(String(p.id)) || keys.has(String(p.slug))
    );
  }, [pack, allProducts]);

  // ====== Pricing : somme au détail + -10% ======
  const detailSumCents = useMemo(
    () => included.reduce((s, p) => s + Number(p.price_cents || 0), 0),
    [included]
  );
  const discountedCents = useMemo(
    () => Math.round(detailSumCents * 0.9),
    [detailSumCents]
  );

  // Points fidélité (simple ratio)
  const points = Math.max(1, Math.floor((discountedCents || 0) / 100));

  // ====== Ajout au panier ======
  function handleAddToCart() {
    if (!pack) return;
    const preview =
      mainImg ||
      (Array.isArray(pack.images) && pack.images[0]) ||
      pack.image ||
      fallbackImg;

    const item = {
      id: String(pack.id),
      name: pack.name,
      price_cents: Number(discountedCents || 0), // prix pack remisé
      image: preview,
      slug: pack.slug || slug,
      brand: pack.brand || "",
    };

    add(item, qty);
    setAddedOk(true);
    setTimeout(() => setAddedOk(false), 1500);
  }

  // ====== Sections texte riches ======
  const descSummary = pack?.description?.summary || "";
  const descDetailed = pack?.description?.detailed || "";

  const benefits = Array.isArray(pack?.advantages) ? pack.advantages : [];

  const useSummary = pack?.how_to_use?.summary || pack?.how_to?.[0] || "";
  const useSteps = Array.isArray(pack?.how_to_use?.steps)
    ? pack.how_to_use.steps
    : Array.isArray(pack?.how_to)
    ? pack.how_to
    : [];
  const usePrecautions = Array.isArray(pack?.how_to_use?.precautions)
    ? pack.how_to_use.precautions
    : [];

  const inciList = Array.isArray(pack?.ingredients?.list) ? pack.ingredients.list : [];
  const keyRoles =
    pack?.ingredients?.key_ingredients_roles &&
    typeof pack.ingredients.key_ingredients_roles === "object"
      ? pack.ingredients.key_ingredients_roles
      : {};

  const productsDetail = Array.isArray(pack?.products_detail) ? pack.products_detail : [];

  // Accordéons
  const [active, setActive] = useState({
    desc: true,
    how: true,
    inci: false,
    detail: true, // section cartes "products_detail"
  });

  // ====== Rendu ======
  if (loading) {
    return (
      <div className="product-big-container">
        <SiteHeader />
        <main className="product-container">
          <div className="back-row">
            <Link to={backHref} className="btn-back">← Retour au catalogue</Link>
          </div>
          <div className="product-loading">Chargement du pack…</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (err) {
    return (
      <div className="product-big-container">
        <SiteHeader />
        <main className="product-container">
          <div className="back-row">
            <Link to={backHref} className="btn-back">← Retour au catalogue</Link>
          </div>
          <div className="product-notfound">{err}</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!pack) {
    return (
      <div className="product-big-container">
        <SiteHeader />
        <main className="product-container">
          <div className="back-row">
            <Link to={backHref} className="btn-back">← Retour au catalogue</Link>
          </div>
          <div className="product-notfound">Pack introuvable.</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="product-big-container">
      <SiteHeader />

      <main className="product-container">
        {/* fil d'Ariane simple */}
        <div className="back-row">
          <Link to={backHref} className="btn-back">← Retour au catalogue</Link>
        </div>

        {/* TOP : galerie + achat */}
        <div className="product-wrapper">
          {/* Galerie */}
          <section className="product-gallery">
            <div className="product-main-image">
              {mainImg ? (
                <img
                  src={mainImg}
                  alt={pack.name}
                  onError={(e) => (e.currentTarget.src = fallbackImg)}
                />
              ) : (
                <div style={{ height: 300 }} />
              )}

              {/* badge -XX% si réduction réelle */}
              {detailSumCents > discountedCents && (
                <div className="bundle-discount-pill">
                  -{Math.round((1 - discountedCents / Math.max(1, detailSumCents)) * 100)}%
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
              {pack.brand ? (
                <div className="pi-brand">{pack.brand}</div>
              ) : (
                <div className="pi-brand">Korelia</div>
              )}

              <h1 className="pi-name">{pack.name}</h1>

              {/* ligne "au détail" barré */}
              {detailSumCents > 0 && discountedCents < detailSumCents && (
                <div className="pack-compare-line">
                  <span className="old-price">{fmtEur.format(detailSumCents / 100)}</span>
                  <span className="compare-note">au détail</span>
                </div>
              )}
            </div>

            {/* Avantages clés */}
            {benefits.length > 0 && (
              <div className="pi-benefits">
                <div className="pi-benefits-title">Pourquoi ce pack ?</div>
                <ul className="pi-benefits-list">
                  {benefits.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Bloc achat */}
            <div className="pi-purchase">
              <div className="qty-row">
                <label htmlFor="qty-pack">Quantité</label>
                <div className="qty-controls">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    aria-label="Diminuer"
                  >
                    −
                  </button>
                  <input
                    id="qty-pack"
                    type="number"
                    min="1"
                    value={qty}
                    onChange={(e) => {
                      const v = Math.max(1, parseInt(e.target.value || "1", 10));
                      setQty(v);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setQty((q) => q + 1)}
                    aria-label="Augmenter"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="price-row">
                <span className={`price ${addedOk ? "pulse" : ""}`}>
                  {fmtEur.format((discountedCents || 0) / 100)}
                </span>

                <button
                  className={`btn-primarya ${addedOk ? "ok" : ""}`}
                  onClick={handleAddToCart}
                  aria-live="polite"
                  title="Ajouter le pack au panier"
                >
                  {addedOk ? "Ajouté ✓" : "Ajouter au panier"}
                </button>

                <div
                  className={`cart-toast ${addedOk ? "show" : ""}`}
                  role="status"
                  aria-live="polite"
                >
                  Pack ajouté au panier ✓
                </div>
              </div>

              {/* Petit rappel économie */}
              {detailSumCents > 0 && discountedCents < detailSumCents && (
                <div className="pack-price-compare">
                  <div className="ppc-line">
                    <s>{fmtEur.format(detailSumCents / 100)}</s> <em>au détail</em>
                  </div>
                  <div className="ppc-save">
                    Vous économisez {fmtEur.format((detailSumCents - discountedCents) / 100)}
                  </div>
                </div>
              )}

              <div className="pi-points-block">
                À l’achat : <strong>{points}</strong> points gagnés
              </div>
            </div>
          </section>
        </div>

        {/* ===== Sections riches ===== */}
        <section className="product-sections">
          {/* Description & Bénéfices */}
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

          {/* Détails des produits (name/role/benefits) */}
          {productsDetail.length > 0 && (
            <div className="pi-section">
              <div
                className="acc-head"
                onClick={() => setActive((s) => ({ ...s, detail: !s.detail }))}
                role="button"
                aria-expanded={active.detail}
                tabIndex={0}
              >
                <h2>Détails des produits du pack</h2>
                <span className={`chev ${active.detail ? "open" : ""}`}>⌄</span>
              </div>

              {active.detail && (
                <div className="acc-body">
                  <div className="pd-grid">
                    {productsDetail.map((pd, i) => (
                      <div key={i} className="pd-card">
                        {pd.name && <div className="pd-name">{pd.name}</div>}
                        {pd.role && <div className="pd-role">{pd.role}</div>}
                        {Array.isArray(pd.benefits) && pd.benefits.length > 0 && (
                          <ul className="pd-list">
                            {pd.benefits.map((b, j) => (
                              <li key={j}>{b}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Utilisation */}
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

         
        </section>

        {/* ===== Contenu du pack ===== */}
        <section className="bundle-section">
          <div className="bundle-headline">Contenu du pack</div>

          {included.length === 0 ? (
            <p className="bundle-empty">Les produits seront précisés bientôt.</p>
          ) : (
            <div className="bundle-grid">
              {included.map((p) => {
                // Image n°1 depuis products.json (images[0]), sinon fallback sur image, sinon placeholder
                const img1 =
                  (Array.isArray(p.images) && p.images[0] && normalizeImgPath(p.images[0])) ||
                  (p.image && normalizeImgPath(p.image)) ||
                  fallbackImg;

                return (
                  <Link key={p.id} to={withQuery(`/produit/${p.slug}`)} className="bundle-card">
                    <div className="bundle-img-wrap">
                      <img
                        src={img1}
                        alt={p.name}
                        onError={(e) => {
                          e.currentTarget.src = fallbackImg;
                        }}
                      />
                    </div>
                    <div className="bundle-meta">
                      {p.brand && <div className="bundle-brand">{p.brand}</div>}
                      <div className="bundle-name">{p.name}</div>
                      <div className="bundle-price">{fmtEur.format((p.price_cents || 0) / 100)}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

