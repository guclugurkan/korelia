// src/pages/ComposePack.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import { useCart } from "../cart/CartContext";
import { useAuth } from "../auth/AuthContext";
import { apiGet } from "../lib/api";
import "./ComposePack.css";
import SiteHeader from "../components/SiteHeader";

const fmtEur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const PAGE_SIZE = 9;

/* --------- Assets helpers --------- */
const fallbackImg =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'>
      <rect width='100%' height='100%' fill='#f3f4f6'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
        fill='#9ca3af' font-family='system-ui,Segoe UI,Roboto,Arial' font-size='18'>
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
function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// --- Couvertures perso par catégorie (clé = slug de la catégorie) ---
const CAT_COVERS = {
  nettoyant: "/img/types/nettoyant/img1.png",
  toner: "/img/types/toner/img1.png",
  serum:"/img/types/serum-ampoule/img1.png",
  creme: "/img/types/creme/img1.png",
  spf: "/img/types/spf/img1.png",
  contouryeux: "/img/types/contour-des-yeux/img1.png",
  essence: "/img/types/essence/img1.png",
  masque: "/img/types/mask/img1.png",
  gommage: "/img/types/gommage/img1.png"

  // ...ajoute toutes les catégories que tu veux, clés en slug (accents retirés)
};

// Retourne l’URL publique si une cover perso est dispo
function catCoverFor(label) {
  const key = slugify(label);        // "Crème" -> "creme"
  const p = CAT_COVERS[key] || null; // chemin défini ci-dessus
  return p ? publicAsset(p) : null;
}


export default function ComposePack() {


// Catégories à exclure du composeur
const EXCLUDED_CATS = new Set(["pack", "kit", "patch"]);
const isExcludedCat = (name) => {
  const key = String(name || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return EXCLUDED_CATS.has(key);
};





  const { add } = useCart();
  const { user } = useAuth();

  // ——— Phases: kind -> cats -> items
  const [phase, setPhase] = useState("kind"); // "kind" | "cats" | "items"

  // ——— Kind (Essentiel = 3, Standard = 5)
  const [kind, setKind] = useState("essentiel");
  const requiredCount = kind === "essentiel" ? 3 : 5;
  const discountPct = kind === "essentiel" ? 0.05 : 0.10;

  // ——— Produits
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setErr("");
        setLoading(true);
        const list = await apiGet("/api/products");
        const enriched = await Promise.all(
          (Array.isArray(list) ? list : []).map(async (p) => {
            const hasTwo = Array.isArray(p.images) && p.images.length >= 2;
            if (hasTwo) return p;
            try {
              const key = String(p.slug || p.id);
              const full = await apiGet(`/api/products/${key}`);
              const images = Array.isArray(full.images) ? full.images : p.images;
              const image = full.image ?? p.image;
              return { ...p, images, image };
            } catch {
              return p;
            }
          })
        );
        if (!cancelled) setItems(enriched);
      } catch (e) {
        if (!cancelled) setErr(e.message || "Erreur de chargement des produits");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ——— Catégories (exclure "pack")
const categories = useMemo(() => {
  const set = new Set(
    items
      .map((p) => p.category || p.type || p.product_type || null)
      .filter(Boolean)
      .map(String)
  );

  return Array.from(set)
    .filter((c) => !isExcludedCat(c)) // ⬅️ enlève pack/kit/patch
    .sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));
}, [items]);


  // ——— Sélection des catégories (ordre)
  const [selectedCats, setSelectedCats] = useState([]);
  const toggleCat = (c) => {
    setSelectedCats((prev) => {
      if (prev.includes(c)) return prev.filter((x) => x !== c);
      if (prev.length >= requiredCount) return prev;
      return [...prev, c];
    });
  };
  const canGoItems = selectedCats.length === requiredCount;

  // ——— Répartition par catégorie
const byCat = useMemo(() => {
  const g = Object.create(null);
  for (const p of items) {
    const keyRaw = p.category || p.type || p.product_type || "";
    if (!keyRaw) continue;
    if (isExcludedCat(keyRaw)) continue; // ⬅️ skip pack/kit/patch
    const key = String(keyRaw).toLowerCase();
    if (!g[key]) g[key] = [];
    g[key].push(p);
  }
  for (const k of Object.keys(g)) {
    g[k].sort(
      (a, b) =>
        (a.brand || "").localeCompare(b.brand || "", "fr", { sensitivity: "base" }) ||
        String(a.name || "").localeCompare(String(b.name || ""), "fr", { sensitivity: "base" })
    );
  }
  return g;
}, [items]);


  // ——— Étape produit (phase items)
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (phase !== "items") return;
    setStep((s) => Math.min(Math.max(0, s), Math.max(0, selectedCats.length - 1)));
  }, [phase, selectedCats.length]);

  const currentCat = selectedCats[step] || null;
  const currentCatKey = String(currentCat || "").toLowerCase();

  // ——— Choix des produits { [catKey]: product }
  const [selections, setSelections] = useState({});
  const choose = (catKey, product) => setSelections((prev) => ({ ...prev, [catKey]: product }));

  // ——— Filtre peau + pagination
  const [skinFilter, setSkinFilter] = useState("");
  const [pageByCat, setPageByCat] = useState({});
  const currPage = pageByCat[currentCatKey] || 1;

  const filteredForCat = useMemo(() => {
    const pool = (byCat[currentCatKey] || []).filter(Boolean);
    if (!skinFilter) return pool;
    return pool.filter((p) => {
      const s = new Set();
      if (Array.isArray(p.skin_types)) p.skin_types.forEach((t) => s.add(String(t).toLowerCase()));
      if (p.skin_type) s.add(String(p.skin_type).toLowerCase());
      return s.has(String(skinFilter).toLowerCase());
    });
  }, [byCat, currentCatKey, skinFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredForCat.length / PAGE_SIZE));
  const start = (currPage - 1) * PAGE_SIZE;
  const pageSlice = filteredForCat.slice(start, start + PAGE_SIZE);
  const setPageForCat = (catKey, p) =>
    setPageByCat((m) => ({ ...m, [catKey]: Math.max(1, Math.min(pageCount, p)) }));

  useEffect(() => {
    setPageForCat(currentCatKey, 1);
  }, [currentCatKey, skinFilter]);

  // ——— Totaux & galerie
  const totalCents = useMemo(() => {
    let sum = 0;
    for (const c of selectedCats) {
      const k = String(c).toLowerCase();
      sum += Number(selections[k]?.price_cents || 0);
    }
    return sum;
  }, [selectedCats, selections]);

  const discountCents = Math.round(totalCents * discountPct);
  const afterCents = totalCents - discountCents;

  const galleryImgs = useMemo(() => {
    const imgs = [];
    for (const c of selectedCats) {
      const k = String(c).toLowerCase();
      const p = selections[k];
      if (!p) continue;
      const img = collectImages(p, 1)[0] || fallbackImg;
      if (!imgs.includes(img)) imgs.push(img);
    }
    return imgs.length ? imgs : [fallbackImg];
  }, [selectedCats, selections]);

  const [galIdx, setGalIdx] = useState(0);
  useEffect(() => {
    setGalIdx((i) => Math.min(Math.max(0, i), Math.max(0, galleryImgs.length - 1)));
  }, [galleryImgs.length]);

  // ——— Pack name + toast
  const [packName, setPackName] = useState("");
  const [toast, setToast] = useState("");
  const fireToast = (msg) => {
    setToast(msg);
    window.clearTimeout((fireToast)._t);
    (fireToast)._t = window.setTimeout(() => setToast(""), 1800);
  };

  // ——— Add to cart
  const addToCart = () => {
    if (selectedCats.length !== requiredCount) return;
    for (const c of selectedCats) {
      const k = String(c).toLowerCase();
      if (!selections[k]) return;
    }

    const components = selectedCats.map((c) => {
      const k = String(c).toLowerCase();
      const p = selections[k];
      return {
        id: String(p.id),
        qty: 1,
        name: p.name,
        brand: p.brand || "",
        price_cents: Number(p.price_cents || 0),
        image: collectImages(p, 1)[0] || fallbackImg,
        slug: p.slug || String(p.id),
      };
    });

    const firstImg = (components[0] && components[0].image) || galleryImgs[0] || fallbackImg;
    const name =
      packName.trim() ||
      `Pack personnalisé (${kind === "essentiel" ? "Essentiel" : "Standard"})`;

    add(
      {
        id: `custom-pack-${Date.now()}`,
        type: "pack",
        name,
        price_cents: afterCents,
        image: firstImg,
        components,
        meta: { packKind: kind, discountPct },
      },
      1
    );
    fireToast("Pack ajouté au panier 🎉");
  };

  // ——— Save pack (Account.jsx)
  const savePack = () => {
    if (!user) { fireToast("Connecte-toi pour enregistrer ton pack."); return; }
    const uid = user.id || user.email || "user";
    const key = `my_packs_${uid}`;
    const pack = {
      id: `saved-pack-${Date.now()}`,
      kind,
      selectedCats,
      selections,
      total_cents: totalCents,
      discount_cents: discountCents,
      final_cents: afterCents,
      name: packName.trim() || null,
      created_at: new Date().toISOString(),
    };
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    localStorage.setItem(key, JSON.stringify([pack, ...existing]));
    fireToast("Pack enregistré ✅ (voir Mon compte)");
  };

  /* ===================== RENDER ===================== */
  return (
    <main className="compose-wrap">
      <SiteHeader />

      <div className="compose-container">
        <div className="compose-head">
          <h1>Composer mon pack</h1>
          <p>1) Choisis le type de pack · 2) Choisis les types de produits · 3) Choisis les produits</p>
        </div>

        {/* PHASE 1 — GROS BLOCS AVEC IMAGES (carrés 1/1, image plein cadre) */}
        {phase === "kind" && (
          <section className="card phase-box">
            <h2>1) Choisis ton type de pack</h2>

            <div className="kind-grid">
              <button
                className={`kind-card ${kind === "essentiel" ? "is-active" : ""}`}
                onClick={() => setKind("essentiel")}
                aria-label="Choisir Pack Essentiel"
                style={{ backgroundImage: `url(${publicAsset("/img/compose-pack-img/pack-3-produit/img1.png") || ""})` }}
              >
                <div className="kc-overlay">
                  <div className="kc-badge">−5%</div>
                  <div className="kc-text">
                    <div className="kc-title">Pack Essentiel</div>
                    <div className="kc-sub">3 produits </div>
                    <ul className="kc-bullets">
                   
                      
                    </ul>
                  </div>
                </div>
              </button>

              <button
                className={`kind-card ${kind === "standard" ? "is-active" : ""}`}
                onClick={() => setKind("standard")}
                aria-label="Choisir Pack Standard"
                style={{ backgroundImage: `url(${publicAsset("/img/compose-pack-img/pack-5-produit/img1.png") || ""})` }}
              >
                <div className="kc-overlay">
                  <div className="kc-badge">−10%</div>
                  <div className="kc-text">
                    <div className="kc-title">Pack Standard</div>
                    <div className="kc-sub">5 produits </div>
                   
                  </div>
                </div>
              </button>
            </div>

            <div className="phase-actions">
              <Link to="/catalogue" className="btn-ghost">← Retour au catalogue</Link>
              <button
                className="btn-primary"
                onClick={() => { setSelectedCats([]); setSelections({}); setPhase("cats"); }}
              >
                Continuer → 
              </button>
              
            </div>
          </section>
        )}


        {/* PHASE 2 — TYPES DE PRODUITS EN CARTES (ratio 1/1.25) */}
        {phase === "cats" && (
          <section className="cardd phase-box">
            <h2>2) Choisis {requiredCount} types de produits</h2>
            <p className="muted">
              Sélectionne {requiredCount} cartes ci-dessous (dans l’ordre où tu souhaites choisir les produits).
            </p>

            <div className="catgrid">
              {categories.map((c) => {
                const active = selectedCats.includes(c);
                const disabled = !active && selectedCats.length >= requiredCount;
                const idx = active ? selectedCats.indexOf(c) + 1 : null;

                const key = String(c).toLowerCase();

                // 1) essaie l’image perso si fournie
                const customCover = catCoverFor(c);

                // 2) sinon 1re image d’un produit de cette catégorie
                const first = (byCat?.[key] || [])[0];
                const prodImg = first ? collectImages(first, 1)[0] : null;

                // 3) sinon placeholder
                const img = customCover || prodImg || fallbackImg;

                return (
                  <button
                    key={c}
                    type="button"
                    className={`catcard ${active ? "is-selected" : ""} ${disabled ? "is-disabled" : ""}`}
                    onClick={() => !disabled && toggleCat(c)}
                    aria-pressed={active}
                    aria-label={`Choisir la catégorie ${c}`}
                    disabled={disabled}
                  >
                    <div className="catcard-head">
                      <div className="catcard-title">{String(c).toUpperCase()}</div>
                      {active && <div className="catcard-idx" aria-hidden>{idx}</div>}
                    </div>
                    <div className="catcard-img">
                      <img
                        src={img}
                        alt={`Illustration ${c}`}
                        loading="lazy"
                        onError={(e) => { e.currentTarget.src = fallbackImg; }}
                      />
                    </div>
                  </button>
                );
              })}


            </div>

            {selectedCats.length > 0 && (
              <div className="cats-picked">
                {selectedCats.map((c, i) => (
                  <span key={c} className="picked">
                    <span className="idx">{i + 1}</span>
                    {c}
                  </span>
                ))}
              </div>
            )}

            <div className="phase-actions">
              <button className="btn-ghost" onClick={() => setPhase("kind")}>← Type de pack</button>
              <button
                className="btn-primary"
                onClick={() => setPhase("items")}
                disabled={!canGoItems}
              >
                Continuer → Choisir les produits
              </button>
            </div>
          </section>
        )}


        {/* PHASE 3 — CHOIX DES PRODUITS (identique) */}
        {phase === "items" && (
          <div className="compose-grid">
            {/* Col 1 : Galerie */}
            <section className="compose-gallery cardd">
              <div className="gallery-main">
                <img
                  src={galleryImgs[galIdx] || fallbackImg}
                  alt="Aperçu du pack"
                  onError={(e) => (e.currentTarget.src = fallbackImg)}
                />
                {galleryImgs.length > 1 && (
                  <>
                    <button
                      className="gal-arrow left"
                      onClick={() => setGalIdx((i) => (i - 1 + galleryImgs.length) % galleryImgs.length)}
                      aria-label="Précédent"
                    >‹</button>
                    <button
                      className="gal-arrow right"
                      onClick={() => setGalIdx((i) => (i + 1) % galleryImgs.length)}
                      aria-label="Suivant"
                    >›</button>
                  </>
                )}
              </div>
              {galleryImgs.length > 1 && (
                <div className="gallery-thumbs">
                  {galleryImgs.map((src, i) => (
                    <button
                      key={i}
                      className={`thumb-btn ${i === galIdx ? "is-active" : ""}`}
                      onClick={() => setGalIdx(i)}
                    >
                      <img src={src} alt={`Miniature ${i + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Col 2 : Récap */}
            <section className="compose-info cardd">
              <h2>Récapitulatif</h2>
              <div className="recap">
                <div className="recap-line"><span>Sous-total</span><span className="val">{fmtEur.format(totalCents / 100)}</span></div>
                <div className="recap-line"><span>Remise (−{Math.round(discountPct * 100)}%)</span><span className="val">− {fmtEur.format(discountCents / 100)}</span></div>
                <hr />
                <div className="recap-total"><span>Total</span><span className="val">{fmtEur.format(afterCents / 100)}</span></div>

                <label className="packname">
                  <span>Nom du pack (optionnel)</span>
                  <input
                    value={packName}
                    onChange={(e) => setPackName(e.target.value)}
                    placeholder={`Ex: Ma routine ${kind === "essentiel" ? "Essentiel" : "Standard"}`}
                  />
                </label>

                <div className="recap-actions">
                  <button
                    className="btn-primary"
                    onClick={addToCart}
                    disabled={
                      selectedCats.length !== requiredCount ||
                      selectedCats.some((c) => !selections[String(c).toLowerCase()])
                    }
                  >
                    Ajouter au panier
                  </button>
                  <button
                    className="btn-ghost"
                    onClick={savePack}
                    disabled={
                      selectedCats.length !== requiredCount ||
                      selectedCats.some((c) => !selections[String(c).toLowerCase()])
                    }
                  >
                    Enregistrer dans Mes packs
                  </button>
                </div>

                {toast && <div className="mini-toast">{toast}</div>}
              </div>

              <div className="phase-actions compact">
                <button className="btn-ghost" onClick={() => setPhase("cats")}>← Types de produits</button>
              </div>
            </section>

            {/* Col 3 : Choix produit par catégorie */}
            <aside className="compose-chooser">
              <div className="chooser cardd">
                <div className="chooser-head">
                  <div className="chooser-title">
                    {selectedCats.map((c, i) => (
                      <button
                        key={c}
                        className={`crumb ${i === step ? "is-active" : ""} ${selections[String(c).toLowerCase()] ? "done" : ""}`}
                        onClick={() => setStep(i)}
                        title={c}
                      >
                        <span className="idx">{i + 1}</span>
                        <span className="label">{c}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="chooser-filters">
                  <label>
                    <span>Type de peau</span>
                    <select value={skinFilter} onChange={(e) => setSkinFilter(e.target.value)}>
                      <option value="">Toutes</option>
                      <option value="grasse">Grasse</option>
                      <option value="mixte">Mixte</option>
                      <option value="sèche">Sèche</option>
                      <option value="sensible">Sensible</option>
                      <option value="normale">Normale</option>
                      <option value="acnéique">Acnéique</option>
                      <option value="déshydratée">Déshydratée</option>
                      <option value="mature">Mature</option>
                    </select>
                  </label>
                </div>

                <div className="chooser-grid">
                  {pageSlice.map((p) => {
                    const [imgPrimary, imgHover] = collectImages(p, 2);
                    const checked = selections[currentCatKey]?.id === p.id;
                    const unavailable = Number.isFinite(p.stock) && p.stock <= 0;

                    return (
                      <label
                        key={p.id}
                        className={`chooser-cardd ${checked ? "is-selected" : ""} ${unavailable ? "is-disabled" : ""}`}
                        title={unavailable ? "Rupture de stock" : p.name}
                      >
                        <input
                          type="radio"
                          name={`pick-${currentCatKey}`}
                          checked={checked}
                          onChange={() => !unavailable && choose(currentCatKey, p)}
                          disabled={unavailable}
                        />
                        <div className="thumb">
                          <img className="img primary" src={imgPrimary} alt={p.name} />
                          <img className="img secondary" src={imgHover || imgPrimary} alt="" />
                          {unavailable && <div className="oos-tag">Rupture de stock</div>}
                        </div>
                        <div className="meta">
                          {p.brand && <div className="brand">{p.brand}</div>}

                          <div className="name">{p.name}</div>

                          <div className="price">
                            {fmtEur.format((p.price_cents || 0) / 100)}
                          </div>

                          {Array.isArray(p.skin_types) && p.skin_types.length > 0 && (
                            <div className="skinsGroup" aria-label="Types de peau">
                              {p.skin_types.map((s, i) => (
                                <span
                                  key={i}
                                  className={`skinChip skin-${slugify(s)}`}
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                      </label>
                    );
                  })}

                  {pageSlice.length === 0 && <div className="muted">Aucun produit pour ce filtre.</div>}
                </div>

                <div className="chooser-pag">
                  <button className="btn-ghost" onClick={() => setPageForCat(currentCatKey, currPage - 1)} disabled={currPage <= 1}>←</button>
                  <div>Page {currPage} / {pageCount}</div>
                  <button className="btn-ghost" onClick={() => setPageForCat(currentCatKey, currPage + 1)} disabled={currPage >= pageCount}>→</button>
                </div>

                <div className="chooser-steps">
                  <button className="btn-ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step <= 0}>← Précédent</button>
                  <button className="btn-primary" onClick={() => setStep((s) => Math.min(selectedCats.length - 1, s + 1))} disabled={step >= selectedCats.length - 1}>Suivant →</button>
                </div>
              </div>
            </aside>
          </div>
        )}

        {err && <p className="compose-alert error" style={{marginTop:12}}>{err}</p>}
        {loading && <p className="compose-alert" style={{marginTop:12}}>Chargement…</p>}
      </div>

      <Footer />
    </main>
  );
}
