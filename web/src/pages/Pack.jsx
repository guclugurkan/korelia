// src/pages/Pack.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "../components/Header";
import SiteHeader from "../components/SiteHeader"
import Footer from "../components/Footer";
import { useCart } from "../cart/CartContext";
import "./Pack.css";


const API = import.meta.env.VITE_API_URL || "http://localhost:4242";
const fmtEur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

// fallback visuel si pas d'image
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

function normalizeImgPath(p) {
  if (!p) return null;
  if (/^https?:\/\//i.test(p)) return p;
  if (p.startsWith("/")) return p;
  return "/" + p.replace(/^(\.\/|\.\.\/)+/, "");
}

export default function Pack() {
  const { slug } = useParams();
  const { add } = useCart();

  // Etat principal pack
  const [pack, setPack] = useState(null);
  const [allProducts, setAllProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // galerie
  const [mainImg, setMainImg] = useState(null);

  // achat
  const [qty, setQty] = useState(1);
  const [addedOk, setAddedOk] = useState(false);

  // on charge le pack + tous les produits (pour lister le contenu)
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
        if (mounted) setPack(dataPack);

        // catalogue complet pour retrouver les produits inclus
        const ra = await fetch(`${API}/api/products`, {
          headers: { Accept: "application/json" },
        });
        const dataAll = await ra.json().catch(() => []);
        if (!ra.ok) throw new Error("Produits indisponibles");
        if (mounted) setAllProducts(Array.isArray(dataAll) ? dataAll : []);
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

  // images pack
  const images = useMemo(() => {
    const arr = [];
    if (Array.isArray(pack?.images) && pack.images.length) {
      pack.images.forEach((p) => arr.push(normalizeImgPath(p) || fallbackImg));
    } else if (pack?.image) {
      arr.push(normalizeImgPath(pack.image) || fallbackImg);
    }
    if (!arr.length) arr.push(fallbackImg);
    return arr;
  }, [pack]);

  // mettre l'image principale
  useEffect(() => {
    setMainImg(images?.[0] || null);
  }, [JSON.stringify(images)]);

  // contenu du pack : on match pack.products_included avec tous les produits
  const included = useMemo(() => {
    if (!pack || !Array.isArray(pack.products_included)) return [];
    const keys = new Set(pack.products_included.map(String));
    return allProducts.filter(
      (p) => keys.has(String(p.id)) || keys.has(String(p.slug))
    );
  }, [pack, allProducts]);

  // Prix / remise
  const detailSumCents = useMemo(
    () => included.reduce((s, p) => s + Number(p.price_cents || 0), 0),
    [included]
  );
  const discountCents = Math.round(detailSumCents * 0.1); // -10%
  const discountedCents = Math.max(0, detailSumCents - discountCents);

  // Si le pack a un prix forcé en DB on le prend, sinon on prend "prix détaillé - 10%"
  const packPriceCents = Number(pack?.price_cents ?? discountedCents);

  // Points fidélité (même logique que Product.jsx)
  const points = Math.max(1, Math.floor((packPriceCents || 0) / 100));

  // Pour ce composant : pas de notion de stock détaillé pack => on considère toujours dispo
  const inStock = true;
  const canInc = true; // quantité libre

  function handleAddToCart() {
    if (!pack) return;
    if (!inStock) return;

    const preview =
      mainImg ||
      (Array.isArray(pack.images) && pack.images[0]) ||
      pack.image ||
      fallbackImg;

    const item = {
      id: String(pack.id),
      name: pack.name,
      price_cents: Number(packPriceCents || 0),
      image: preview,
      slug: pack.slug || slug,
      brand: pack.brand || "",
    };

    add(item, qty);
    setAddedOk(true);
    setTimeout(() => setAddedOk(false), 1500);
  }

  // ====== Contenu textuel riche (mêmes structures que Product.jsx) ======
  // description
  const descSummary = pack?.description?.summary || "";
  const descDetailed = pack?.description?.detailed || "";

  // "advantages" du pack -> on l'utilise comme "benefits"
  const benefits = Array.isArray(pack?.advantages) ? pack.advantages : [];

  // utilisation
  const useSummary = pack?.how_to_use?.summary || pack?.how_to?.[0] || "";
  const useSteps = Array.isArray(pack?.how_to_use?.steps)
    ? pack.how_to_use.steps
    : Array.isArray(pack?.how_to)
    ? pack.how_to
    : [];
  const usePrecautions = Array.isArray(pack?.how_to_use?.precautions)
    ? pack.how_to_use.precautions
    : [];

  // ingrédients
  const inciList = Array.isArray(pack?.ingredients?.list)
    ? pack.ingredients.list
    : [];
  const keyRoles =
    pack?.ingredients?.key_ingredients_roles &&
    typeof pack.ingredients.key_ingredients_roles === "object"
      ? pack.ingredients.key_ingredients_roles
      : {};

  // Accordéons ouverts par défaut
  const [active, setActive] = useState({
    desc: true,
    how: true,
    inci: false,
  });

  // ====== Rendu ======

  if (loading) {
    return (
      <div className="product-big-container">
        <SiteHeader />
        <main className="product-container">
          <div className="back-row">
            <Link to="/catalogue" className="btn-back">← Retour au catalogue</Link>
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
            <Link to="/catalogue" className="btn-back">← Retour au catalogue</Link>
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
        <SiteHeader/>
        <main className="product-container">
          <div className="back-row">
            <Link to="/catalogue" className="btn-back">← Retour au catalogue</Link>
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
        {/* fil d'ariane simple */}
        <div className="back-row">
          <Link to="/catalogue" className="btn-back">← Retour au catalogue</Link>
        </div>

        {/* WRAPPER haut : galerie + infos achat */}
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

              {/* badge promo -10% si on a une vraie remise */}
              {detailSumCents > packPriceCents && (
                <div className="bundle-discount-pill">
                  -{Math.round((1 - packPriceCents / detailSumCents) * 100)}%
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
              {/* brand du pack, sinon "Korelia" */}
              {pack.brand && <div className="pi-brand">{pack.brand}</div>}
              {!pack.brand && <div className="pi-brand">Korelia</div>}

              <h1 className="pi-name">{pack.name}</h1>

              {/* comparaison prix pack vs prix au détail */}
              {detailSumCents > packPriceCents && (
                <div className="pack-compare-line">
                  <span className="old-price">
                    {fmtEur.format(detailSumCents / 100)}
                  </span>{" "}
                  <span className="compare-note">au détail</span>
                </div>
              )}
            </div>

            {/* Avantages clés (on reprend "advantages") */}
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

            {/* bloc achat luxe comme Product.jsx */}
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
                  {fmtEur.format((packPriceCents || 0) / 100)}
                </span>

                <button
                  className={`btn-primarya ${addedOk ? "ok" : ""}`}
                  disabled={!inStock}
                  onClick={handleAddToCart}
                  aria-live="polite"
                  title={inStock ? "Ajouter le pack au panier" : "Rupture de stock"}
                >
                  {inStock
                    ? addedOk
                      ? "Ajouté ✓"
                      : "Ajouter au panier"
                    : "Rupture"}
                </button>

                <div
                  className={`cart-toast ${addedOk ? "show" : ""}`}
                  role="status"
                  aria-live="polite"
                >
                  Pack ajouté au panier ✓
                </div>
              </div>

              <div className="pi-points-block">
                À l’achat : <strong>{points}</strong> points gagnés
              </div>
            </div>
          </section>
        </div>

        {/* ===== Sections riches du pack ===== */}
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

          {/* Ingrédients */}
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
                {/* ingrédients clés */}
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

                {/* INCI complet */}
                {inciList.length > 0 && (
                  <div className="box block">
                    <div className="box-title">INCI complet</div>
                    <p className="box-text">{inciList.join(", ")}</p>
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
              {included.map((p) => (
                <Link
                  key={p.id}
                  to={`/produit/${p.slug}`}
                  className="bundle-card"
                >
                  <div className="bundle-img-wrap">
                    <img
                      src={normalizeImgPath(p.image) || fallbackImg}
                      alt={p.name}
                      onError={(e) => (e.currentTarget.src = fallbackImg)}
                    />
                  </div>
                  <div className="bundle-meta">
                    <div className="bundle-brand">{p.brand}</div>
                    <div className="bundle-name">{p.name}</div>
                    <div className="bundle-price">
                      {fmtEur.format((p.price_cents || 0) / 100)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
