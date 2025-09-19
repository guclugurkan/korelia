// src/pages/PanierPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useCart } from "../cart/CartContext";
import { Link, useNavigate } from "react-router-dom";
import HeaderAll from "../components/HeaderAll";
import Footer from "../components/Footer";
import "./Panier.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:4242";
const fmtEur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const FREE_SHIPPING_THRESHOLD = 5000; // 50,00 €

function normalizeImgPath(p) {
  if (!p) return null;
  if (/^https?:\/\//i.test(p)) return p;
  if (p.startsWith("/")) return p;
  return "/" + p.replace(/^(\.\/|\.\.\/)+/, "");
}
function getCsrf() {
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

export default function PanierPage(){
  const { items, setQty, remove, clear, total_cents } = useCart();
  const nav = useNavigate();
  const hasItems = items.length > 0;

  // ——— Code promo ———
  const [promoInput, setPromoInput] = useState(localStorage.getItem("cart_promo_code") || "");
  // appliedPromo: { code, promotion_code_id?, description? } si validé via API
  const [appliedPromo, setAppliedPromo] = useState(() => {
    const saved = localStorage.getItem("cart_promo_applied");
    try { return saved ? JSON.parse(saved) : null; } catch { return null; }
  });
  const [promoMsg, setPromoMsg] = useState("");

  // ——— UI états ———
  const [busyId, setBusyId] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  // Estimation frais de port (mêmes règles que serveur)
  const shippingEst = useMemo(() => {
    const standard = total_cents >= FREE_SHIPPING_THRESHOLD ? 0 : 490;
    const express  = 990;
    return {
      standard_cents: standard,
      express_cents: express,
      freeReached: total_cents >= FREE_SHIPPING_THRESHOLD,
      missingForFree_cents: Math.max(0, FREE_SHIPPING_THRESHOLD - total_cents),
      barPct: Math.max(0, Math.min(100, Math.round((total_cents / FREE_SHIPPING_THRESHOLD) * 100)))
    };
  }, [total_cents]);

  // Récupère un CSRF (si ce n’est pas déjà fait globalement)
  useEffect(()=>{
    (async()=>{
      try { await fetch(`${API}/auth/csrf`, { credentials:"include" }); } catch {}
    })();
  },[]);

  async function applyPromo(e){
    e?.preventDefault?.();
    setPromoMsg("");
    const code = promoInput.trim();
    if (!code) {
      setAppliedPromo(null);
      localStorage.removeItem("cart_promo_applied");
      localStorage.removeItem("cart_promo_code");
      setPromoMsg("Entrez un code promo.");
      return;
    }

    try{
      const csrf = getCsrf();
      const r = await fetch(`${API}/api/validate-promo`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type":"application/json",
          "x-csrf-token": csrf
        },
        body: JSON.stringify({
          promo_code: code,
          items: items.map(x => ({ id: x.id, qty: x.qty }))
        })
      });
      const data = await r.json().catch(()=> ({}));
      if (!r.ok) throw new Error(data.error || "Code promo invalide.");

      const applied = { code: data.code, promotion_code_id: data.promotion_code_id, description: data.description };
      setAppliedPromo(applied);
      localStorage.setItem("cart_promo_applied", JSON.stringify(applied));
      localStorage.setItem("cart_promo_code", code);
      setPromoMsg(`Code appliqué : ${data.code}${data.description ? " ("+data.description+")" : ""}`);
    }catch(err){
      setAppliedPromo(null);
      localStorage.removeItem("cart_promo_applied");
      setPromoMsg(err.message || "Code promo invalide.");
    }
  }

  function removePromo() {
    setAppliedPromo(null);
    localStorage.removeItem("cart_promo_applied");
    localStorage.removeItem("cart_promo_code");
    setPromoMsg("Code retiré.");
  }

  async function startCheckout() {
    if (!hasItems || checkingOut) return;
    try{
      setPromoMsg("");
      setCheckingOut(true);

      const payload = {
        items: items.map(x => ({ id: x.id, qty: x.qty })),
        promo_code: appliedPromo?.code || "" // on ne renvoie le code que s'il a été validé
      };
      const csrf = getCsrf();

      const r = await fetch(`${API}/api/create-checkout-session`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type":"application/json",
          "Accept":"application/json",
          "x-csrf-token": csrf
        },
        body: JSON.stringify(payload)
      });
      const data = await r.json().catch(()=> ({}));

      if (!r.ok) throw new Error(data.error || "Impossible de créer la session de paiement");
      if (!data.url) throw new Error("URL Stripe manquante");

      window.location.assign(data.url);
    } catch(e){
      setPromoMsg(String(e.message || e));
      setCheckingOut(false);
    }
  }

  if(!hasItems){
    return (
      <main className="cart-wrap">
        <HeaderAll/>
        <div className="cart-container">
          <section className="empty">
            <div className="empty-card">
              <div className="emoji">🛒</div>
              <h2>Votre panier est vide</h2>
              <p>Découvrez nos nouveautés et best-sellers.</p>
              <div className="actions">
                <Link to="/catalogue" className="btn-primary">Voir le catalogue</Link>
                <Link to="/" className="btn-ghost">← Retour à l’accueil</Link>
              </div>
            </div>
          </section>
        </div>
        <Footer/>
      </main>
    );
  }

  return (
    <main className="cart-wrap">
      <HeaderAll />

      <div className="cart-container">
        <div className="cart-title-row">
          <h1 className="cart-title">Panier</h1>
          <div className="cart-actions-top">
            {!confirmClear ? (
              <button className="btn-ghost danger" onClick={()=>setConfirmClear(true)}>Vider le panier</button>
            ) : (
              <div className="clear-confirm">
                <span>Vider le panier ?</span>
                <button className="btn-ghost" onClick={()=>{ clear(); setConfirmClear(false); }}>Oui</button>
                <button className="btn-ghost" onClick={()=>setConfirmClear(false)}>Non</button>
              </div>
            )}
          </div>
        </div>

        <div className="cart-grid">
          {/* Liste produits */}
          <section className="cart-list card">
            {items.map((it) => {
              const img = normalizeImgPath(it.image);
              const unit = Number(it.price_cents || 0);
              const lineTotal = unit * Number(it.qty || 1);

              return (
                <article key={it.id} className="row">
                  <Link to={`/produit/${it.slug || it.id}`} className="imgBox" aria-label={it.name}>
                    <img
                      src={img || ""}
                      alt={it.name}
                      onError={(e)=>{ e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='system-ui,Segoe UI,Roboto,Arial' font-size='12'%3EImage%20indisponible%3C/text%3E%3C/svg%3E"; }}
                    />
                  </Link>

                  <div className="info">
                    <Link to={`/produit/${it.slug || it.id}`} className="name">{it.name}</Link>
                    {it.variant && <div className="muted small">Variante : {it.variant}</div>}
                    <button
                      className="link danger"
                      onClick={() => remove(it.id)}
                      disabled={busyId === it.id}
                    >
                      Retirer
                    </button>
                  </div>

                  <div className="qtyCell">
                    <QtyStepper
                      value={Number(it.qty || 1)}
                      onChange={(q) => setQty(it.id, Math.max(1, q))}
                      disabled={busyId === it.id}
                    />
                  </div>

                  <div className="priceCell">
                    <div className="unit">{fmtEur.format(unit / 100)}</div>
                    <div className="total">{fmtEur.format(lineTotal / 100)}</div>
                  </div>
                </article>
              );
            })}
          </section>

          {/* Récap + Estimation + Code promo */}
          <aside className="cart-summary">
            {/* Estimation livraison */}
            <div className="ship-card card">
              {shippingEst.freeReached ? (
                <>
                  <div className="ship-title ok">🎉 Livraison standard offerte</div>
                  <div className="ship-progress">
                    <div className="bar"><div className="fill" style={{ width: "100%" }} /></div>
                    <div className="ship-hint">Seuil {fmtEur.format(FREE_SHIPPING_THRESHOLD/100)} atteint.</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="ship-title">Livraison offerte dès {fmtEur.format(FREE_SHIPPING_THRESHOLD/100)}</div>
                  <div className="ship-progress">
                    <div className="bar"><div className="fill" style={{ width: `${shippingEst.barPct}%` }} /></div>
                    <div className="ship-hint">
                      Plus que <strong>{fmtEur.format(shippingEst.missingForFree_cents/100)}</strong> pour l’obtenir 🤍
                    </div>
                  </div>
                </>
              )}

              <div className="ship-estimates">
                <div className="line">
                  <span>Standard</span>
                  <span className="val">{fmtEur.format(shippingEst.standard_cents/100)}</span>
                </div>
                <div className="line">
                  <span>Express</span>
                  <span className="val">{fmtEur.format(shippingEst.express_cents/100)}</span>
                </div>
                <div className="note muted tiny">Montants indicatifs. Calcul exact au paiement.</div>
              </div>
            </div>

            {/* Code promo (validation immédiate) */}
            <div className="promo-card card">
              <div className="promo-title">Code promo</div>
              {appliedPromo ? (
                <div className="promo-applied">
                  <div className="badge-code">
                    {appliedPromo.code}
                    {appliedPromo.description ? <span className="desc"> — {appliedPromo.description}</span> : null}
                  </div>
                  <button className="btn-ghost" onClick={removePromo}>Retirer</button>
                </div>
              ) : (
                <form className="promo-row" onSubmit={applyPromo}>
                  <input
                    placeholder="Saisir votre code"
                    value={promoInput}
                    onChange={(e)=>setPromoInput(e.target.value)}
                  />
                  <button type="submit" className="btn-ghost">Appliquer</button>
                </form>
              )}
              {promoMsg && <div className="muted tiny" style={{marginTop:6}}>{promoMsg}</div>}
              <div className="note muted tiny">Les codes s’appliquent aussi directement dans l’interface Stripe.</div>
            </div>

            {/* Totaux */}
            <div className="sum-card card">
              <div className="sum-line">
                <span>Sous-total</span>
                <span className="val">{fmtEur.format(total_cents/100)}</span>
              </div>
              <div className="sum-small muted">Frais de livraison calculés à l’étape de paiement.</div>
              <hr />
              <button
                className="btn-primary wide"
                onClick={startCheckout}
                disabled={checkingOut}
              >
                {checkingOut ? "Redirection…" : "Passer au paiement"}
              </button>
              <div className="below">
                <Link to="/catalogue" className="link">← Continuer mes achats</Link>
              </div>

              {/* Vider le panier (rappel) */}
              {!confirmClear ? (
                <button className="btn-ghost danger wide" onClick={()=>setConfirmClear(true)} style={{marginTop:10}}>
                  Vider le panier
                </button>
              ) : (
                <div className="clear-inline">
                  <span>Confirmer la suppression de tous les articles ?</span>
                  <div className="clear-actions">
                    <button className="btn-ghost" onClick={()=>{ clear(); setConfirmClear(false); }}>Oui</button>
                    <button className="btn-ghost" onClick={()=>setConfirmClear(false)}>Non</button>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </main>
  );
}

function QtyStepper({ value, onChange, disabled }) {
  return (
    <div className={`qty ${disabled ? "is-disabled" : ""}`}>
      <button type="button" onClick={()=>onChange(Math.max(1, value-1))} disabled={disabled || value <= 1}>−</button>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(e)=> onChange(Math.max(1, Number(e.target.value) || 1))}
        disabled={disabled}
        aria-label="Quantité"
      />
      <button type="button" onClick={()=>onChange(value+1)} disabled={disabled}>+</button>
    </div>
  );
}
