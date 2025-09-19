// src/pages/ComposePack.jsx
import { useEffect, useMemo, useState } from "react";
import HeaderAll from "../components/HeaderAll";
import Footer from "../components/Footer";
import { useCart } from "../cart/CartContext";
import { useAuth } from "../auth/AuthContext";
import "./ComposePack.css";
import { Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:4242";
const fmtEur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

const REQUIRED_STANDARD = ["nettoyant", "toner", "crème", "SPF"];
const REQUIRED_COMPLETE = ["nettoyant", "toner", "serum", "crème", "SPF"];

function normalizeImgPath(p) {
  if (!p) return null;
  if (/^https?:\/\//i.test(p)) return p;
  if (p.startsWith("/")) return p;
  return "/" + String(p).replace(/^(\.\/|\.\.\/)+/, "");
}

const fallbackImg =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'>
      <rect width='100%' height='100%' fill='#f3f4f6'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#9ca3af' font-family='system-ui,Segoe UI,Roboto,Arial' font-size='18'>
        Image indisponible
      </text>
    </svg>`
  );

export default function ComposePack() {
  const { add } = useCart();
  const { user } = useAuth();

  const [type, setType] = useState("standard"); // "standard" | "complet"
  const requiredCats = type === "standard" ? REQUIRED_STANDARD : REQUIRED_COMPLETE;

  const [all, setAll] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  // selections: { [cat]: product }
  const [selections, setSelections] = useState({});

  // images du carrousel (on prend les images des sélections)
  const carouselImgs = useMemo(() => {
    const imgs = [];
    for (const cat of requiredCats) {
      const p = selections[cat];
      if (!p) continue;
      const img = normalizeImgPath(p.image) || fallbackImg;
      if (!imgs.includes(img)) imgs.push(img);
    }
    return imgs.length ? imgs : [fallbackImg];
  }, [selections, requiredCats]);

  const canCheckout = requiredCats.every((c) => !!selections[c]);

  useEffect(() => {
    (async () => {
      try {
        setErr("");
        setLoading(true);
        const r = await fetch(`${API}/api/products`, { headers: { Accept: "application/json" } });
        if (!r.ok) throw new Error("API produits indisponible");
        const data = await r.json();
        setAll(Array.isArray(data) ? data : []);
      } catch (e) {
        setErr(e.message || "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Groupes par catégories utiles
  const byCat = useMemo(() => {
    const g = Object.create(null);
    for (const c of requiredCats) g[c] = [];
    for (const p of all) {
      const cat = String(p.category || "").toLowerCase();
      if (g[cat]) g[cat].push(p);
    }
    // tri simple: par marque puis nom
    for (const k of Object.keys(g)) {
      g[k].sort((a, b) => (a.brand || "").localeCompare(b.brand || "", "fr", { sensitivity: "base" }) || String(a.name || "").localeCompare(String(b.name || ""), "fr", { sensitivity: "base" }));
    }
    return g;
  }, [all, requiredCats]);

  const totalCents = useMemo(() => {
    let sum = 0;
    for (const c of requiredCats) sum += Number(selections[c]?.price_cents || 0);
    return sum;
  }, [selections, requiredCats]);

  const discountCents = Math.round(totalCents * 0.10);
  const afterCents = totalCents - discountCents;

  const choose = (cat, product) => {
    setSelections((prev) => ({ ...prev, [cat]: product }));
  };

  const addToCart = () => {
    if (!canCheckout) return;

    const firstImg = normalizeImgPath(selections[requiredCats[0]]?.image) || fallbackImg;
    const packName = `Pack personnalisé (${type === "standard" ? "Standard" : "Complet"})`;

    add(
      {
        id: `custom-pack-${Date.now()}`,
        name: packName,
        price_cents: afterCents,
        image: firstImg,
        qty: 1,
        // (option) on peut aussi sauvegarder un champ "variant" listant les produits
        variant: Object.values(selections)
          .map((p) => `${p.brand} ${p.name}`)
          .join(" | "),
      },
      1
    );
    alert("Pack ajouté au panier 🎉");
  };

  const savePack = () => {
    if (!canCheckout) return;
    if (!user) {
      alert("Connecte-toi pour enregistrer ce pack dans ton profil (Mes packs).");
      return;
    }
    const uid = user.id || user.email || "user";
    const key = `my_packs_${uid}`;
    const existing = JSON.parse(localStorage.getItem(key) || "[]");

    const pack = {
      id: `saved-pack-${Date.now()}`,
      type,
      selections, // objet {cat: product}
      total_cents: totalCents,
      discount_cents: discountCents,
      final_cents: afterCents,
      created_at: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify([pack, ...existing]));
    alert("Pack enregistré dans Mes packs ✅");
  };

  return (
    <main className="compose-wrap">
      <HeaderAll />

      <div className="compose-container">
        <div className="compose-head">
          <h1>Composer mon pack</h1>
          <p>Crée ton pack {type === "standard" ? "Standard" : "Complet"} et profite de <strong>-10%</strong>.</p>
        </div>

        {/* Choix Standard / Complet */}
        <div className="compose-type">
          <button
            className={`type-btn ${type === "standard" ? "is-active" : ""}`}
            onClick={() => setType("standard")}
          >
            Pack Standard
          </button>
          <button
            className={`type-btn ${type === "complet" ? "is-active" : ""}`}
            onClick={() => setType("complet")}
          >
            Pack Complet
          </button>
          <Link to="/catalogue" className="type-link">← Retour au catalogue</Link>
        </div>

        {err && <p className="compose-alert error">{err}</p>}
        {loading && <p className="compose-alert">Chargement…</p>}

        {!loading && !err && (
          <div className="compose-grid">
            {/* Colonne 1 : Galerie / Carrousel simple */}
            <section className="compose-gallery card">
              <div className="gallery-main">
                {/* mini carrousel très simple : on affiche la première, et des miniatures en dessous */}
                <img
                  src={carouselImgs[0]}
                  alt="Aperçu du pack"
                  onError={(e) => (e.currentTarget.src = fallbackImg)}
                />
              </div>
              {carouselImgs.length > 1 && (
                <div className="gallery-thumbs">
                  {carouselImgs.map((src, i) => (
                    <button
                      key={i}
                      className="thumb-btn"
                      onClick={() => {
                        // swap la première image avec celle cliquée
                        const copy = [...carouselImgs];
                        const idx = i;
                        // petit hack: on force l’ordre via selections (pas de state pour le carrousel)
                        const img = new Image();
                        img.src = src; // precharge
                        // on set juste l’order en changeant… plus simple: on défile en CSS ?
                        // Pour rester simple ici on ne fait que “focus” visuel
                        const el = document.querySelector(".gallery-main img");
                        if (el) el.src = src;
                      }}
                    >
                      <img src={src} alt={`Miniature ${i + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Colonne 2 : Avantages + Guide (texte fixe) */}
            <section className="compose-info card">
              <h2>Avantages</h2>
              <ul className="bullets">
                <li>-10% automatique sur la sélection.</li>
                <li>Tu choisis exactement ce qui convient à ta peau.</li>
                <li>Ré-achetable en 1 clic via “Mes packs”.</li>
              </ul>

              <h2>Guide d’utilisation</h2>
              <ol className="steps">
                <li>Nettoyant — matin & soir.</li>
                <li>Toner — rééquilibre & prépare la peau.</li>
                {type === "complet" && <li>Sérum — ciblé selon ton objectif.</li>}
                <li>Crème — scelle l’hydratation.</li>
                <li>SPF — le matin, dernière étape.</li>
              </ol>
            </section>

            {/* Colonne 3 : Sélecteurs + Récap prix */}
            <aside className="compose-chooser">
              {requiredCats.map((cat) => (
                <fieldset key={cat} className="chooser card">
                  <legend className="chooser-title">{cat.toUpperCase()}</legend>
                  <div className="chooser-list">
                    {(byCat[cat] || []).map((p) => {
                      const img = normalizeImgPath(p.image) || fallbackImg;
                      const checked = selections[cat]?.id === p.id;
                      return (
                        <label key={p.id} className={`chooser-item ${checked ? "is-selected" : ""}`}>
                          <input
                            type="radio"
                            name={`pick-${cat}`}
                            checked={checked}
                            onChange={() => choose(cat, p)}
                          />
                          <span className="thumb">
                            <img src={img} alt={p.name} onError={(e)=> (e.currentTarget.src = fallbackImg)} />
                          </span>
                          <span className="meta">
                            <span className="name">{p.brand} — {p.name}</span>
                            <span className="price">{fmtEur.format((p.price_cents || 0) / 100)}</span>
                          </span>
                        </label>
                      );
                    })}
                    {(!byCat[cat] || byCat[cat].length === 0) && (
                      <div className="muted">Aucun produit disponible pour “{cat}”.</div>
                    )}
                  </div>
                </fieldset>
              ))}

              <div className="recap card">
                <div className="recap-line">
                  <span>Sous-total</span>
                  <span className="val">{fmtEur.format(totalCents / 100)}</span>
                </div>
                <div className="recap-line">
                  <span>Remise pack (-10%)</span>
                  <span className="val">− {fmtEur.format(discountCents / 100)}</span>
                </div>
                <hr />
                <div className="recap-total">
                  <span>Total</span>
                  <span className="val">{fmtEur.format(afterCents / 100)}</span>
                </div>

                <div className="recap-actions">
                  <button className="btn-primary" onClick={addToCart} disabled={!canCheckout}>
                    Ajouter au panier
                  </button>
                  <button className="btn-ghost" onClick={savePack} disabled={!canCheckout}>
                    Enregistrer dans Mes packs
                  </button>
                </div>

                {!canCheckout && (
                  <div className="muted tiny" style={{marginTop:8}}>
                    Choisis un produit dans chaque catégorie requise.
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
