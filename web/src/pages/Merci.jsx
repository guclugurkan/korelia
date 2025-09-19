// src/pages/Merci.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import HeaderAll from "../components/HeaderAll";
import Footer from "../components/Footer";
import { useAuth } from "../auth/AuthContext";
import "./Merci.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4242";

function formatCents(cents, currency = "eur") {
  const n = Number(cents || 0) / 100;
  try {
    return new Intl.NumberFormat("fr-BE", { style: "currency", currency: currency.toUpperCase() }).format(n);
  } catch {
    return `${n.toFixed(2)} ${currency.toUpperCase()}`;
  }
}

export default function Merci() {
  const { user } = useAuth();
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  const sessionId = useMemo(() => {
    const sp = new URLSearchParams(window.location.search);
    return sp.get("session_id") || "";
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchWithRetry() {
      if (!sessionId) {
        setError("Session de paiement introuvable.");
        setLoading(false);
        return;
      }

      const maxTries = 10;
      const delayMs = 800;

      for (let attempt = 1; attempt <= maxTries && !cancelled; attempt++) {
        try {
          const res = await fetch(`${API_URL}/api/orders/by-session/${encodeURIComponent(sessionId)}`, {
            credentials: "include",
          });
          if (res.ok) {
            const data = await res.json();
            if (!cancelled) {
              setOrder(data);
              setLoading(false);
            }
            return;
          }
          if (res.status === 404) {
            if (attempt === maxTries) {
              const body = await res.json().catch(() => ({}));
              throw new Error(body.error || "Commande non trouvée");
            }
          } else {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || `Erreur serveur (${res.status})`);
          }
        } catch (e) {
          if (attempt === maxTries && !cancelled) {
            setError(e.message || "Erreur réseau");
            setLoading(false);
            return;
          }
        }
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }

    fetchWithRetry();
    return () => { cancelled = true; };
  }, [sessionId]);

  if (loading) {
    return (
      <main className="merci-wrap">
        <HeaderAll />
        <div className="merci-container">
          <section className="card center">
            <div className="big-emoji">❤️</div>
            <h1 className="title">Merci&nbsp;!</h1>
            <p className="muted">Nous finalisons votre commande…</p>
          </section>
        </div>
        <Footer />
      </main>
    );
  }

  if (error) {
    return (
      <main className="merci-wrap">
        <HeaderAll />
        <div className="merci-container">
          <section className="card center">
            <div className="big-emoji">😬</div>
            <h1 className="title">Oups</h1>
            <p className="error">{error}</p>
            <div className="actions">
              <Link to="/catalogue" className="btn-primary">← Retour au catalogue</Link>
              <Link to="/" className="btn-ghost">Accueil</Link>
            </div>
          </section>
        </div>
        <Footer />
      </main>
    );
  }

  if (!order) return null;

  const {
    customer_name,
    email,
    amount_total,
    amount_subtotal,
    shipping_cost,
    currency,
    shipping,
    items,
    stripe_line_items,
  } = order;

  const displayItems = Array.isArray(items) && items.length ? items : (stripe_line_items || []);
  const earnedPoints = Math.max(0, Math.floor(Number(amount_subtotal ?? amount_total ?? 0) / 100));

  // CTA invité : propose la création de compte
  const isGuest = !user;
  const registerHref = email
    ? `/inscription?email=${encodeURIComponent(email)}`
    : `/inscription`;

  return (
    <main className="merci-wrap">
      <HeaderAll />

      <div className="merci-container">
        {/* HERO */}
        <section className="hero card">
          <div className="hero-left">
            <div className="check">✓</div>
            <div className="hero-texts">
              <h1 className="title">Merci pour votre commande 🎉</h1>
              <p className="muted">
                Une confirmation a été envoyée à <strong>{email || "votre adresse"}</strong>.
              </p>
            </div>
          </div>
          <div className="hero-actions">
            {user ? (
              <Link to="/mon-compte" className="btn-ghost">Voir mon compte</Link>
            ) : (
              <Link to={registerHref} className="btn-primary">Créer mon compte</Link>
            )}
            <Link to="/catalogue" className="btn-ghost">Continuer mes achats</Link>
          </div>
        </section>

        {/* AVANTAGES / POINTS */}
        <section className="perks card">
          <div className="perks-left">
            <div className="gift">🎁</div>
            <div>
              <h2 className="card-title">Programme Points & Récompenses</h2>
              {user ? (
                <p className="muted">
                  Bravo&nbsp;! Cette commande vous rapporte <strong>+{earnedPoints} pts</strong>. 
                  Cumulez vos points et échangez-les contre des <strong>codes promo</strong> (ex&nbsp;: 5€ dès 30€, 12€ dès 50€, 35€ dès 70€).
                </p>
              ) : (
                <p className="muted">
                  Créez un compte en 10 secondes pour <strong>garder l’historique</strong>, suivre vos commandes
                  et profiter du <strong>programme de points</strong>. Cette commande vous aurait rapporté&nbsp;
                  <strong> +{earnedPoints} pts</strong> 🤍
                </p>
              )}
            </div>
          </div>
          <div className="perks-actions">
            {isGuest ? (
              <Link to={registerHref} className="btn-primary">Créer un compte</Link>
            ) : (
              <Link to="/mon-compte" className="btn-ghost">Voir mes points</Link>
            )}
          </div>
        </section>

        {/* RÉCAP COMMANDE */}
        <section className="grid">
          <div className="card">
            <h2 className="card-title">Résumé</h2>
            <Row label="Sous-total" value={formatCents(amount_subtotal, currency)} />
            <Row label="Livraison" value={formatCents(shipping_cost, currency)} />
            <hr className="sep" />
            <Row label={<strong>Total</strong>} value={<strong>{formatCents(amount_total, currency)}</strong>} />
          </div>

          <div className="card">
            <h2 className="card-title">Articles</h2>
            <ul className="items">
              {displayItems.map((it, idx) => {
                const qty = it.qty ?? it.quantity ?? 1;
                const lineCents =
                  typeof it.amount_subtotal === "number"
                    ? it.amount_subtotal
                    : (typeof it.unit_price_cents === "number" ? it.unit_price_cents * qty : 0);

                return (
                  <li key={idx} className="item">
                    <div className="i-left">
                      <div className="i-name">{it.name || `Produit #${it.id}`}</div>
                      <div className="i-sub muted small">Qté : {qty}</div>
                    </div>
                    <div className="i-right">
                      {lineCents ? formatCents(lineCents, currency) : ""}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="card">
            <h2 className="card-title">Livraison</h2>
            {shipping?.address ? (
              <address className="addr">
                {shipping?.name || customer_name || ""}<br/>
                {shipping.address.line1}{shipping.address.line2 ? `, ${shipping.address.line2}` : ""}<br/>
                {shipping.address.postal_code} {shipping.address.city}<br/>
                {shipping.address.country}
                {shipping?.phone ? <><br/>Tél : {shipping.phone}</> : null}
              </address>
            ) : (
              <p className="muted">Adresse non fournie.</p>
            )}
          </div>
        </section>

        {/* ACTIONS BAS DE PAGE */}
        <section className="card center soft">
          <div className="actions">
            <Link to="/catalogue" className="btn-primary">← Continuer mes achats</Link>
            {user ? (
              <Link to="/mon-compte" className="btn-ghost">Voir mon compte</Link>
            ) : (
              <Link to={registerHref} className="btn-ghost">Créer un compte</Link>
            )}
            <Link to="/" className="btn-ghost">Accueil</Link>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}

function Row({ label, value }) {
  return (
    <div className="row">
      <span className="row-label">{label}</span>
      <span className="row-val">{value}</span>
    </div>
  );
}
