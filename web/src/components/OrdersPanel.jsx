import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:4242";
const euro = (cents) => (Number(cents || 0) / 100).toFixed(2) + " €";
const stepLabels = ["Payée", "Préparation", "Expédiée", "Livrée"];

function stepFromStatus(status){
  switch((status||"paid")){
    case "paid": return 0;
    case "preparing": return 1;
    case "shipped": return 2;
    case "delivered": return 3;
    default: return 0;
  }
}

// prix unitaire depuis un line item Stripe si dispo
function unitFromStripeLine(li){
  const q = li.quantity ?? li.qty ?? 1;
  const sub = Number(li.amount_subtotal || 0);
  return q > 0 ? sub / q : 0;
}

/**
 * Props:
 *   - limit?: number  (par défaut: Infinity)
 *   - showAllButton?: boolean (par défaut: false)
 */
export default function OrdersPanel({ limit = Infinity, showAllButton = false }){
  const [orders, setOrders] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    (async ()=>{
      try{
        const r = await fetch(`${API}/me/orders`, { credentials: "include" });
        const data = await r.json().catch(() => ([]));
        if (!r.ok) throw new Error(data.error || "Impossible de charger vos commandes");
        setOrders(data);
      }catch(e){ setErr(e.message); }
      finally{ setLoading(false); }
    })();
  },[]);

  if (loading) return <div className="card"><p>Chargement des commandes…</p></div>;
  if (err) return <div className="card"><p className="acc-alert error">{err}</p></div>;

  if (!orders.length) {
    return (
      <div className="card">
        <h2 className="card-title">Mes commandes</h2>
        <p className="muted">Aucune commande pour le moment.</p>
      </div>
    );
  }

  const shown = orders.slice(0, limit);

  return (
    <div className="card">
      <div className="card-head">
        <h2 className="card-title">Mes commandes</h2>
        {showAllButton && orders.length > shown.length && (
          <Link to="/mes-commandes" className="btn-ghost">Voir toutes les commandes</Link>
        )}
      </div>

      <div className="orders-list">
        {shown.map((o, idx) => {
          const number = idx + 1;
          const currentStep = stepFromStatus(o.status);
          const createdIso = o.createdAt || Date.now();
          const when = new Date(createdIso).toLocaleString("fr-BE");

          const subtotal = Number(o.amount_subtotal ?? o.amount_total ?? 0);
          const points = Math.floor(subtotal / 100); // 1pt/€

          return (
            <article key={o.id} className="order-item">
              <div className="order-head">
                <div className="oh-left">
                  <div className="order-id">Commande {number}</div>
                  <div className="order-date">{when}</div>
                </div>
                <div className="oh-right">
                  <strong className="order-total">{euro(o.amount_total || 0)}</strong>
                  <span className="order-status">{o.status || "paid"}</span>
                </div>
              </div>

              <div className="order-ref">
                Référence : <span title={o.id}>{o.id}</span>
              </div>

              {/* Stepper suivi */}
              <ol className="order-steps">
                {stepLabels.map((label, sidx) => (
                  <li key={label} className={sidx <= currentStep ? "done" : ""}>{label}</li>
                ))}
              </ol>

              {/* Tracking s’il existe */}
              {o.tracking && (o.tracking.carrier || o.tracking.number || o.tracking.url) && (
                <div className="order-tracking">
                  <div><b>Transporteur:</b> {o.tracking.carrier || "—"}</div>
                  <div><b>N°:</b> {o.tracking.number || "—"}</div>
                  {o.tracking.url && (
                    <div>
                      <a href={o.tracking.url} target="_blank" rel="noreferrer">Lien de suivi</a>
                    </div>
                  )}
                </div>
              )}

              {/* Lignes d'articles */}
              <div className="order-lines">
                {Array.isArray(o.stripe_line_items) && o.stripe_line_items.length ? (
                  <ul>
                    {o.stripe_line_items.map((li, i)=>{
                      const q = li.quantity ?? li.qty ?? 1;
                      const unit = unitFromStripeLine(li);
                      return (
                        <li key={i}>
                          <span className="qty">×{q}</span> {li.name} — <span className="price">{euro(unit)}</span>
                        </li>
                      );
                    })}
                  </ul>
                ) : Array.isArray(o.items) && o.items.length ? (
                  <ul>
                    {o.items.map((it, i)=>(
                      <li key={i}>
                        <span className="qty">{it.qty}.</span> {it.name || `Produit ${it.id}`}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">Détails indisponibles.</p>
                )}
              </div>

              <div className="order-points">Points gagnés : <strong>+{points} pts</strong></div>
            </article>
          );
        })}
      </div>

      {showAllButton && orders.length > shown.length && (
        <div style={{marginTop:12, display:"flex", justifyContent:"flex-end"}} />
      )}
    </div>
  );
}
