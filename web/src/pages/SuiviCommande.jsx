// src/pages/SuiviCommande.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import "./Suivi.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:4242";
const fmtEur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function StatusBadge({ status }) {
  const map = {
    paid: { label: "Payée", cls: "st-paid" },
    preparing: { label: "En préparation", cls: "st-prep" },
    shipped: { label: "Expédiée", cls: "st-ship" },
    delivered: { label: "Livrée", cls: "st-deliv" },
    canceled: { label: "Annulée", cls: "st-cancel" },
  };
  const info = map[status] || { label: status || "—", cls: "st-unknown" };
  return <span className={`st-badge ${info.cls}`}>{info.label}</span>;
}

function Timeline({ status, history = [] }) {
  const steps = ["paid", "preparing", "shipped", "delivered"];
  const idx = Math.max(0, steps.indexOf(status));
  return (
    <div className="tl">
      {steps.map((s, i) => (
        <div key={s} className={`tl-step ${i <= idx ? "is-done" : ""}`}>
          <div className="dot" />
          <div className="label">
            <StatusBadge status={s} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ItemsList({ order }) {
  const lines =
    (Array.isArray(order.items) && order.items.length
      ? order.items.map((it) => ({ name: it.name || ("#" + it.id), qty: it.qty || 1, cents: it.price_cents || 0 }))
      : Array.isArray(order.stripe_line_items)
      ? order.stripe_line_items.map((li) => ({
          name: li.name,
          qty: li.qty ?? li.quantity ?? 1,
          cents: li.amount_subtotal ?? 0, // c'est le sous-total de la ligne
        }))
      : []) || [];

  if (!lines.length) return <div className="muted small">Détails d’articles indisponibles.</div>;

  return (
    <ul className="items">
      {lines.map((l, i) => (
        <li key={i}>
          <span className="i-name">{l.name}</span>
          <span className="i-qty">×{l.qty}</span>
        </li>
      ))}
    </ul>
  );
}

export default function SuiviCommande() {
  const q = useQuery();
  const nav = useNavigate();

  // onglets
  const [tab, setTab] = useState(() => (q.get("tab") === "mine" ? "mine" : "lookup"));

  // ——— LOOKUP invité ———
  const [inputId, setInputId] = useState(() => q.get("id") || q.get("session_id") || "");
  const [ord, setOrd] = useState(null);
  const [lookErr, setLookErr] = useState("");
  const [loading, setLoading] = useState(false);

  // ——— MES COMMANDES (auth) ———
  const [myOrders, setMyOrders] = useState([]);
  const [myErr, setMyErr] = useState("");
  const [myLoading, setMyLoading] = useState(false);

  // Si on arrive avec ?id=… -> on tente direct
  useEffect(() => {
    const id = q.get("id") || q.get("session_id");
    if (id) {
      setTab("lookup");
      handleLookup(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLookup(manualId) {
    const id = String(manualId || inputId || "").trim();
    if (!id) {
      setLookErr("Entre ton numéro de commande.");
      setOrd(null);
      return;
    }
    try {
      setLoading(true);
      setLookErr("");
      setOrd(null);
      const r = await fetch(`${API}/api/orders/by-session/${encodeURIComponent(id)}`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.error || "Commande introuvable.");
      setOrd(data);
      // maj l’URL pour partage
      const sp = new URLSearchParams(window.location.search);
      sp.set("id", id);
      nav({ search: sp.toString() }, { replace: true });
    } catch (e) {
      setLookErr(e.message || "Commande introuvable.");
    } finally {
      setLoading(false);
    }
  }

  async function loadMyOrders() {
    try {
      setMyLoading(true);
      setMyErr("");
      setMyOrders([]);
      const r = await fetch(`${API}/me/orders`, { credentials: "include", headers: { Accept: "application/json" } });
      const data = await r.json().catch(() => ([]));
      if (!r.ok) throw new Error(data?.error || "Impossible de charger vos commandes.");
      setMyOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      setMyErr(e.message || "Erreur");
    } finally {
      setMyLoading(false);
    }
  }

  // si on va sur l’onglet “mine” -> charge
  useEffect(() => {
    if (tab === "mine") loadMyOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <main className="trk-wrap">
      <SiteHeader/>

      <header className="trk-hero">
        <h1>Suivi de commande</h1>
        <p>Renseigne ton numéro de commande ou retrouve tes achats si tu es connecté(e).</p>
      </header>

      {/* Onglets */}
      <div className="trk-tabs">
        <button className={`tab ${tab === "lookup" ? "is-active" : ""}`} onClick={() => setTab("lookup")}>
          Invité — Numéro de commande
        </button>
        <button className={`tab ${tab === "mine" ? "is-active" : ""}`} onClick={() => setTab("mine")}>
          Mes commandes (connecté)
        </button>
      </div>

      {tab === "lookup" && (
        <section className="card trk-card">
          <form
            className="trk-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleLookup();
            }}
          >
            <label>Numéro de commande (ex: cs_test_...)</label>
            <div className="row">
              <input
                placeholder="Colle ici le numéro reçu par email"
                value={inputId}
                onChange={(e) => setInputId(e.target.value)}
              />
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? "Recherche…" : "Suivre"}
              </button>
            </div>
            {lookErr && <div className="muted err">{lookErr}</div>}
          </form>

          {ord && (
            <div className="trk-result">
              <div className="top">
                <div className="left">
                  <div className="ord-id">
                    Commande <code>{ord.id}</code>
                  </div>
                  <div className="ord-date">
                    {ord.createdAt ? new Date(ord.createdAt).toLocaleString("fr-FR") : ""}
                  </div>
                </div>
                <div className="right">
                  <StatusBadge status={ord.status || ord.payment_status || "paid"} />
                </div>
              </div>

              <Timeline status={ord.status || ord.payment_status || "paid"} history={ord.status_history} />

              <div className="grid">
                <div className="col">
                  <h3>Articles</h3>
                  <ItemsList order={ord} />
                </div>
                <div className="col">
                  <h3>Montant</h3>
                  <div className="money">
                    <div>Ligne articles</div>
                    <div className="val">
                      {fmtEur.format((ord.amount_subtotal ?? ord.amount_total ?? 0) / 100)}
                    </div>
                  </div>
                  <div className="money">
                    <div>Livraison</div>
                    <div className="val">{fmtEur.format((ord.shipping_cost || 0) / 100)}</div>
                  </div>
                  <hr />
                  <div className="money total">
                    <div>Total</div>
                    <div className="val">{fmtEur.format((ord.amount_total || 0) / 100)}</div>
                  </div>
                </div>
              </div>

              <div className="grid">
                <div className="col">
                  <h3>Livraison</h3>
                  {ord.shipping?.address ? (
                    <address className="addr">
                      <div>{ord.shipping?.name || ord.customer_name || ""}</div>
                      <div>
                        {ord.shipping.address.line1}
                        {ord.shipping.address.line2 ? `, ${ord.shipping.address.line2}` : ""}
                      </div>
                      <div>
                        {ord.shipping.address.postal_code} {ord.shipping.address.city}
                      </div>
                      <div>{ord.shipping.address.country}</div>
                      {ord.shipping?.phone ? <div>Tél : {ord.shipping.phone}</div> : null}
                    </address>
                  ) : (
                    <div className="muted small">Adresse non fournie.</div>
                  )}
                </div>

                <div className="col">
                  <h3>Suivi colis</h3>
                  {ord.tracking?.number || ord.tracking?.url || ord.tracking?.carrier ? (
                    <div className="trk-box">
                      {ord.tracking?.carrier && <div>Transporteur : <strong>{ord.tracking.carrier}</strong></div>}
                      {ord.tracking?.number && <div>N° suivi : <strong>{ord.tracking.number}</strong></div>}
                      {ord.tracking?.url && (
                        <div>
                          Lien :{" "}
                          <a href={ord.tracking.url} target="_blank" rel="noreferrer">
                            Ouvrir le suivi
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="muted small">Le suivi sera communiqué une fois le colis expédié.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {tab === "mine" && (
        <section className="card trk-card">
          {myLoading ? (
            <div>Chargement…</div>
          ) : myErr ? (
            <div className="muted err">{myErr}</div>
          ) : myOrders.length === 0 ? (
            <div className="muted">Aucune commande trouvée. <Link to="/compte">Vérifie ton profil</Link>.</div>
          ) : (
            <div className="orders">
              {myOrders.map((o) => (
                <article key={o.id} className="ord-row">
                  <div className="info">
                    <div className="id">
                      <code>{o.id}</code>
                    </div>
                    <div className="date">
                      {o.createdAt ? new Date(o.createdAt).toLocaleString("fr-FR") : ""}
                    </div>
                  </div>
                  <div className="mid">
                    <StatusBadge status={o.status || o.payment_status || "paid"} />
                    <div className="mini">
                      {(o.items_count ?? 0) || "-"} article(s) — {fmtEur.format((o.amount_total || 0) / 100)}
                    </div>
                  </div>
                  <div className="cta">
                    <button className="btn-ghost" onClick={() => { setTab("lookup"); setInputId(o.id); handleLookup(o.id); }}>
                      Suivre
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      <Footer />
    </main>
  );
}
