import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import HeaderAll from "../components/HeaderAll";
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

function normalizeImgPath(p) {
  if (!p) return null;
  if (/^https?:\/\//i.test(p)) return p;
  if (p.startsWith("/")) return p;
  return "/" + p.replace(/^(\.\/|\.\.\/)+/, "");
}

export default function Pack() {
  const { slug } = useParams();
  const { add } = useCart();

  const [pack, setPack] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [imgIndex, setImgIndex] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        setErr(""); setLoading(true);
        const rp = await fetch(`${API}/api/products/${slug}`, { headers: { Accept: "application/json" } });
        const dataP = await rp.json().catch(() => ({}));
        if (!rp.ok) throw new Error(dataP.error || "Pack introuvable");
        setPack(dataP);

        const ra = await fetch(`${API}/api/products`, { headers: { Accept: "application/json" } });
        const dataA = await ra.json().catch(() => []);
        if (!ra.ok) throw new Error("API produits indisponible");
        setAllProducts(Array.isArray(dataA) ? dataA : []);
      } catch (e) {
        setErr(e.message || "Erreur");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const images = useMemo(() => {
    const arr = [];
    if (Array.isArray(pack?.images) && pack.images.length) {
      pack.images.forEach(p => arr.push(normalizeImgPath(p) || fallbackImg));
    } else if (pack?.image) {
      arr.push(normalizeImgPath(pack.image) || fallbackImg);
    }
    if (!arr.length) arr.push(fallbackImg);
    return arr;
  }, [pack]);

  const included = useMemo(() => {
    if (!pack || !Array.isArray(pack.products_included)) return [];
    const keys = new Set(pack.products_included.map(String));
    return allProducts.filter(p => keys.has(String(p.id)) || keys.has(String(p.slug)));
  }, [pack, allProducts]);

  const detailSumCents = useMemo(
    () => included.reduce((s, p) => s + Number(p.price_cents || 0), 0),
    [included]
  );
  const discountCents = Math.round(detailSumCents * 0.10);
  const discountedCents = Math.max(0, detailSumCents - discountCents);
  const packPriceCents = Number(pack?.price_cents ?? discountedCents);

  const addPackToCart = () => {
    if (!pack) return;
    add({
      id: String(pack.id),
      name: pack.name,
      price_cents: packPriceCents,
      image: images[0],
      slug: pack.slug,
    }, 1);
  };

  if (loading) return <main className="pack-loading"><HeaderAll /><div className="pack-container">Chargement…</div><Footer/></main>;
  if (err) return <main className="pack-loading"><HeaderAll /><div className="pack-container error">{err}</div><Footer/></main>;
  if (!pack) return null;

  const advantages = Array.isArray(pack.advantages) ? pack.advantages : [];
  const howTo = Array.isArray(pack.how_to) ? pack.how_to : [];

  return (
    <main className="pack">
      <HeaderAll />

      <div className="pack-container">
        <nav className="pack-breadcrumb">
          <Link to="/catalogue">Catalogue</Link>
          <span>{pack.name}</span>
        </nav>

        <div className="pack-grid">
          <section className="pack-gallery pack-card">
            <div className="pack-main-img">
              <img
                src={images[imgIndex] || fallbackImg}
                alt={pack.name}
                onError={(e) => (e.currentTarget.src = fallbackImg)}
              />
              <div className="pack-discount">-10%</div>
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    className="pack-nav prev"
                    onClick={() => setImgIndex((i) => (i - 1 + images.length) % images.length)}
                  >‹</button>
                  <button
                    type="button"
                    className="pack-nav next"
                    onClick={() => setImgIndex((i) => (i + 1) % images.length)}
                  >›</button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="pack-thumbs">
                {images.map((src, i) => (
                  <button
                    key={i}
                    className={`pack-thumb ${i === imgIndex ? "is-active" : ""}`}
                    onClick={() => setImgIndex(i)}
                  >
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="pack-meta">
            <div className="pack-brand">{pack.brand || "Korelia"}</div>
            <h1 className="pack-title">{pack.name}</h1>

            <div className="pack-price-row">
              <div className="pack-price">{fmtEur.format((packPriceCents || 0) / 100)}</div>
              {detailSumCents > 0 && (
                <div className="pack-compare">
                  <s>{fmtEur.format(detailSumCents / 100)}</s> au détail
                </div>
              )}
            </div>

            <button className="pack-cta" onClick={addPackToCart}>Ajouter le pack au panier</button>

            <div className="pack-block">
              <h3>Avantages</h3>
              {advantages.length ? (
                <ul className="pack-list">
                  {advantages.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              ) : <p>Aucun avantage listé.</p>}
            </div>
          </section>
        </div>

        <section className="pack-section pack-card">
          <h2>Guide d’utilisation</h2>
          <ol className="pack-steps">
            {howTo.length ? howTo.map((s, i) => <li key={i}>{s}</li>) : <li>Étapes à venir…</li>}
          </ol>
        </section>

        <section className="pack-section">
          <h2>Contenu du pack</h2>
          <div className="pack-items">
            {included.map((p) => (
              <Link key={p.id} to={`/produit/${p.slug}`} className="pack-item pack-card">
                <div className="pack-thumb-img">
                  <img src={normalizeImgPath(p.image) || fallbackImg} alt={p.name} />
                </div>
                <div className="pack-item-meta">
                  <div className="pack-item-brand">{p.brand}</div>
                  <div className="pack-item-name">{p.name}</div>
                  <div className="pack-item-price">{fmtEur.format((p.price_cents || 0) / 100)}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
