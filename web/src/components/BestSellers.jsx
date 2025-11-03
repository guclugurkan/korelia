import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./BestSellers.css";
import { useCart } from "../cart/CartContext";
import FavoriteButton from "./FavoriteButton";
import { apiGet } from "../lib/api";

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

function publicAsset(p) {
  if (!p) return null;
  if (/^https?:\/\//i.test(p)) return p;
  const base = import.meta.env.BASE_URL || "/";
  const rel = String(p).replace(/^(\.\/|\.\.\/)+/, "").replace(/^\/+/, "");
  return (base.endsWith("/") ? base : base + "/") + rel;
}

function collectImages(entity, max = 2) {
  const out = [];
  if (Array.isArray(entity?.images)) out.push(...entity.images);
  if (entity?.image) out.push(entity.image);
  const uniq = Array.from(new Set(out.filter(Boolean).map(publicAsset)));
  return (uniq.length ? uniq : [fallbackImg]).slice(0, max);
}

const euro = (c) => (Number(c || 0) / 100).toFixed(2) + " €";

// classes CSS stables
const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export default function BestSellers() {
  const [all, setAll] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  // ouverture des peaux sur mobile (par produit)
  // { [productId]: boolean }
  const [openSkins, setOpenSkins] = useState({});

  const { add } = useCart();

  useEffect(() => {
  (async () => {
    try {
      setErr("");
      setLoading(true);

      const list = await apiGet("/api/products");

      const baseArr = (Array.isArray(list) ? list : []).filter((p) => {
        const idOrSlug = String(p.slug || p.id || "");
        return POPULAR_IDS.includes(idOrSlug);
      });

      // respecter l'ordre POPULAR_IDS
      baseArr.sort((a, b) => {
        const ia = POPULAR_IDS.indexOf(String(a.slug || a.id || ""));
        const ib = POPULAR_IDS.indexOf(String(b.slug || b.id || ""));
        return ia - ib;
      });

      // enrichir si besoin
      const enriched = await Promise.all(
        baseArr.map(async (p) => {
          const needDetails =
            !(Array.isArray(p.images) && p.images.length >= 2) ||
            !p.category ||
            !Array.isArray(p.skin_types);

          if (!needDetails) return p;

          try {
            const key = String(p.slug || p.id);
            const full = await apiGet(`/api/products/${key}`);

            const images = Array.isArray(full.images) ? full.images : p.images;
            const image = full.image ?? p.image;
            const category = full.category ?? p.category ?? null;
            const skin_types = Array.isArray(full.skin_types)
              ? full.skin_types
              : Array.isArray(p.skin_types)
              ? p.skin_types
              : [];

            return { ...p, images, image, category, skin_types };
          } catch {
            return p;
          }
        })
      );

      setAll(enriched);
    } catch (e) {
      setErr(e.message || "Erreur");
    } finally {
      setLoading(false);
    }
  })();
  }, []);

  const addFromCard = (p) => {
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

  function toggleSkins(pId) {
    setOpenSkins((prev) => ({
      ...prev,
      [pId]: !prev[pId],
    }));
  }

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
    <section className="bestSellers" aria-labelledby="bs-title">
      <div className="bs-header">
        <h1 id="bs-title" className="bs-title">
          Best Sellers
        </h1>
      </div>

      {/* rail swipe horizontal */}
      <div className="bs-rail-wrapper">
        <div className="bs-rail" role="list" aria-live="polite">
          {all.map((p, i) => {
            const slug = p.slug || String(p.id);
            const imgs = collectImages(p, 2);
            const imgPrimary = imgs[0] || fallbackImg;
            const imgHover = imgs[1] || imgPrimary;
            const oos = Number.isFinite(p.stock) && p.stock <= 0;

            const skins = Array.isArray(p.skin_types) ? p.skin_types : [];
            const hasSkins = skins.length > 0;
            const isOpen = !!openSkins[p.id];

            return (
              <article
                key={p.id}
                className="bs-card"
                role="listitem"
                style={{ "--i": i }}
              >
                {/* vignette image / favoris / panier */}
                <Link
                  className={`thumb ${oos ? "is-oos" : ""}`}
                  to={`/produit/${slug}`}
                  aria-label={`${p.brand || ""} ${p.name}`}
                >
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

                  {oos && (
                    <div className="oos-cover">
                      <span>Victime de succès</span>
                    </div>
                  )}

                  <div className="bs-fav">
                    <FavoriteButton
                      product={p}
                      size={22}
                      className="bs-fav-btn"
                    />
                  </div>
                </Link>

                {/* bloc texte sous la photo */}
                <div className="meta">
                  {p.brand && <div className="brand">{p.brand}</div>}

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

                  {/* --- Version desktop/tablette : full badges --- */}
                  <div className="badges badges-desktop">
                    {p.category && (
                      <div
                        className={`catBadge cat-${slugify(p.category)}`}
                      >
                        {p.category}
                      </div>
                    )}

                    {hasSkins && (
                      <div
                        className="skinsGroup"
                        aria-label="Types de peau"
                      >
                        {skins.map((s, k) => (
                          <span
                            key={k}
                            className={`skinChip skin-${slugify(s)}`}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* --- Version mobile : compact --- */}
                  <div className="badges badges-mobile">
                    {/* Catégorie en mini */}
                    {p.category && (
                      <div
                        className={`catBadge mini cat-${slugify(
                          p.category
                        )}`}
                      >
                        {p.category}
                      </div>
                    )}

                    {/* Peau : [+] */}
                    {hasSkins && (
                      <div className="skinsMobile">
                        <span className="skinsLabel">Peau :</span>

                        <button
                          type="button"
                          className="moreSkinsBtn"
                          aria-expanded={isOpen}
                          onClick={() => toggleSkins(p.id)}
                        >
                          {isOpen ? "−" : "+"}
                        </button>
                      </div>
                    )}

                    {/* liste des peaux déroulée si ouvert */}
                    {hasSkins && isOpen && (
                      <div className="skinsMobileList">
                        {skins.map((s, idx) => (
                          <span
                            key={idx}
                            className={`skinChipMini skin-${slugify(s)}`}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="bs-footer">
        <Link className="bs-more" to="/catalogue">
          Voir tous les produits
        </Link>
      </div>
    </section>
  );
}
