// src/pages/PanierPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useCart } from "../cart/CartContext";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import "./Panier.css";
import { apiGet, apiPost } from "../lib/api";
import SiteHeader from '../components/SiteHeader';

const fmtEur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const FREE_SHIPPING_THRESHOLD = 5000; // 50,00 €

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
    `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'>
      <rect width='100%' height='100%' fill='#f3f4f6'/>
      <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#9ca3af' font-family='system-ui,Segoe UI,Roboto,Arial' font-size='12'>
        Image indisponible
      </text>
    </svg>`
  );

export default function PanierPage() {
  const { items, setQty, remove, clear, total_cents } = useCart();
  const hasItems = items.length > 0;

  // Code promo
  const [promoInput, setPromoInput] = useState(localStorage.getItem("cart_promo_code") || "");
  // appliedPromo: { code, promotion_code_id, description, kind, percent_off, amount_off_cents, min_cents }
  const [appliedPromo, setAppliedPromo] = useState(() => {
    const saved = localStorage.getItem("cart_promo_applied");
    try { return saved ? JSON.parse(saved) : null; } catch { return null; }
  });
  const [promoMsg, setPromoMsg] = useState("");

  // UI
  const [busyId, setBusyId] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  // CSRF bootstrap
  useEffect(() => { (async () => { try { await apiGet("/auth/csrf"); } catch {} })(); }, []);

  // Estimation de livraison
  const shippingEst = useMemo(() => {
    const standard = total_cents >= FREE_SHIPPING_THRESHOLD ? 0 : 490;
    const express = 990;
    return {
      standard_cents: standard,
      express_cents: express,
      freeReached: total_cents >= FREE_SHIPPING_THRESHOLD,
      missingForFree_cents: Math.max(0, FREE_SHIPPING_THRESHOLD - total_cents),
      barPct: Math.max(0, Math.min(100, Math.round((total_cents / FREE_SHIPPING_THRESHOLD) * 100))),
    };
  }, [total_cents]);

  // Estimation de remise (affichage uniquement)
  const discountEstimate_cents = useMemo(() => {
    if (!appliedPromo) return 0;
    const min = Number(appliedPromo.min_cents || 0);
    if (min && total_cents < min) return 0;
    if (appliedPromo.kind === "fixed") {
      return Math.min(total_cents, Number(appliedPromo.amount_off_cents || 0));
    }
    if (appliedPromo.kind === "percent") {
      const pct = Number(appliedPromo.percent_off || 0) / 100;
      return Math.floor(total_cents * pct);
    }
    return 0;
  }, [appliedPromo, total_cents]);

  const estimatedTotal_cents = Math.max(0, total_cents - discountEstimate_cents);

  async function applyPromo(e) {
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
    try {
      const data = await apiPost("/api/validate-promo", {
        promo_code: code,
        items: items.map((x) => ({ id: x.id, qty: x.qty })),
      });
      const applied = {
        code: data.code,
        promotion_code_id: data.promotion_code_id,
        description: data.description,
        kind: data.kind,
        percent_off: data.percent_off,
        amount_off_cents: data.amount_off_cents,
        min_cents: data.min_cents,
      };
      setAppliedPromo(applied);
      localStorage.setItem("cart_promo_applied", JSON.stringify(applied));
      localStorage.setItem("cart_promo_code", code);
      setPromoMsg(`Code appliqué : ${data.code}${data.description ? " (" + data.description + ")" : ""}`);
    } catch (err) {
      setAppliedPromo(null);
      localStorage.removeItem("cart_promo_applied");
      setPromoMsg(err?.message || "Code promo invalide.");
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
  try {
    setPromoMsg("");
    setCheckingOut(true);

    // On transforme le contenu du panier local (items du CartContext)
    // -> en payload riche pour l'API
    const enrichedItems = items.map((it) => {
      if (it.type === "pack" && Array.isArray(it.components)) {
        return {
          type: "custom_pack",
          name: it.name,
          qty: it.qty,
          price_cents: it.price_cents,      // total remisé du pack entier
          components: it.components.map(c => ({
            id: c.id,
            qty: c.qty || 1
          })),
          meta: it.meta || {}
        };
      }

      // fallback produit normal
      return {
        type: "single",
        id: it.id,
        qty: it.qty
      };
    });

    const payload = {
      items: enrichedItems,
      promo_code: appliedPromo?.code || "",
    };

    const data = await apiPost("/api/create-checkout-session", payload);

    if (!data.url) throw new Error("URL Stripe manquante");
    window.location.assign(data.url);
  } catch (e) {
    setPromoMsg(String(e.message || e));
    setCheckingOut(false);
  }
}



  if (!hasItems) {
    return (
      <main className="cart-wrap">
        <SiteHeader />
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
        <Footer />
      </main>
    );
  }

  return (
    <main className="cart-wrap">
      <SiteHeader />
      <div className="cart-container">
        <div className="cart-title-row">
          <h1 className="cart-title">Panier</h1>
          <div className="cart-actions-top">
            {!confirmClear ? (
              <button className="btn-ghost danger" onClick={() => setConfirmClear(true)}>Vider le panier</button>
            ) : (
              <div className="clear-confirm">
                <span>Vider le panier ?</span>
                <button className="btn-ghost" onClick={() => { clear(); setConfirmClear(false); }}>Oui</button>
                <button className="btn-ghost" onClick={() => setConfirmClear(false)}>Non</button>
              </div>
            )}
          </div>
        </div>

        <div className="cart-grid">
          <section className="cart-list card">
            {items.map((it) => {
              const img = publicAsset(it.image) || fallbackImg;
              const unit = Number(it.price_cents || 0);
              const lineTotal = unit * Number(it.qty || 1);
              return (
                <article key={it.id} className="row">
                  <Link to={`/produit/${it.slug || it.id}`} className="imgBox" aria-label={it.name}>
                    <img src={img} alt={it.name} onError={(e) => { e.currentTarget.src = fallbackImg; }} />
                  </Link>
                  <div className="info">
                    <Link to={`/produit/${it.slug || it.id}`} className="name">{it.name}</Link>
                    {it.variant && <div className="muted small">Variante : {it.variant}</div>}
                    <button className="link danger" onClick={() => remove(it.id)} disabled={busyId === it.id}>Retirer</button>
                  </div>
                  <div className="qtyCell">
                    <QtyStepper value={Number(it.qty || 1)} onChange={(q) => setQty(it.id, Math.max(1, q))} disabled={busyId === it.id} />
                  </div>
                  <div className="priceCell">
                    <div className="total">{fmtEur.format(lineTotal / 100)}</div>
                  </div>
                </article>
              );
            })}
          </section>

          <aside className="cart-summary">
            {/* Livraison */}
            <div className="ship-card card">
              {shippingEst.freeReached ? (
                <>
                  <div className="ship-title ok">🎉 Livraison standard offerte</div>
                  <div className="ship-progress">
                    <div className="bar"><div className="fill" style={{ width: "100%" }} /></div>
                    <div className="ship-hint">Seuil {fmtEur.format(FREE_SHIPPING_THRESHOLD / 100)} atteint.</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="ship-title">Livraison offerte dès {fmtEur.format(FREE_SHIPPING_THRESHOLD / 100)}</div>
                  <div className="ship-progress">
                    <div className="bar"><div className="fill" style={{ width: `${shippingEst.barPct}%` }} /></div>
                    <div className="ship-hint">Plus que <strong>{fmtEur.format(shippingEst.missingForFree_cents / 100)}</strong> pour l’obtenir 🤍</div>
                  </div>
                </>
              )}
              <div className="ship-estimates">
                <div className="line"><span>Standard</span><span className="val">{fmtEur.format(shippingEst.standard_cents / 100)}</span></div>
                <div className="line"><span>Express</span><span className="val">{fmtEur.format(shippingEst.express_cents / 100)}</span></div>
                <div className="note muted tiny">Montants indicatifs. Calcul exact au paiement.</div>
              </div>
            </div>

            {/* Code promo */}
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
                  <input placeholder="Saisir votre code" value={promoInput} onChange={(e) => setPromoInput(e.target.value)} />
                  <button type="submit" className="btn-ghost">Appliquer</button>
                </form>
              )}
              {promoMsg && <div className="muted tiny" style={{ marginTop: 6 }}>{promoMsg}</div>}
              <div className="note muted tiny">La remise s’appliquera aussi dans l’interface Stripe.</div>
            </div>

            {/* Totaux */}
            <div className="sum-card card">
              <div className="sum-line">
                <span>Sous-total</span>
                <span className="val">{fmtEur.format(total_cents / 100)}</span>
              </div>

              {discountEstimate_cents > 0 && (
                <div className="sum-line">
                  <span>Remise (estimée)</span>
                  <span className="val">−{fmtEur.format(discountEstimate_cents / 100)}</span>
                </div>
              )}

              {discountEstimate_cents > 0 && (
                <>
                  <hr />
                  <div className="sum-line strong">
                    <span>Total estimé</span>
                    <span className="val">{fmtEur.format(estimatedTotal_cents / 100)}</span>
                  </div>
                </>
              )}

              <div className="sum-small muted">Frais de livraison calculés à l’étape de paiement.</div>
              <hr />
              <button className="btn-primary wide" onClick={startCheckout} disabled={checkingOut}>
                {checkingOut ? "Redirection…" : "Passer au paiement"}
              </button>
              <div className="below">
                <Link to="/catalogue" className="link">← Continuer mes achats</Link>
              </div>

              {!confirmClear ? (
                <button className="btn-ghost danger wide" onClick={() => setConfirmClear(true)} style={{ marginTop: 10 }}>
                  Vider le panier
                </button>
              ) : (
                <div className="clear-inline">
                  <span>Confirmer la suppression de tous les articles ?</span>
                  <div className="clear-actions">
                    <button className="btn-ghost" onClick={() => { clear(); setConfirmClear(false); }}>Oui</button>
                    <button className="btn-ghost" onClick={() => setConfirmClear(false)}>Non</button>
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
      <button type="button" onClick={() => onChange(Math.max(1, value - 1))} disabled={disabled || value <= 1}>−</button>
      <input type="number" min={1} value={value} onChange={(e) => onChange(Math.max(1, Number(e.target.value) || 1))} disabled={disabled} aria-label="Quantité" />
      <button type="button" onClick={() => onChange(value + 1)} disabled={disabled}>+</button>
    </div>
  );
}
