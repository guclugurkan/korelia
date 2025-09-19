import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4242";
const euro = (cents) => (Number(cents || 0) / 100).toFixed(2) + " €";
const fmtDate = (iso) => new Date(iso).toLocaleString("fr-BE");

const ORDER_STATUSES = [
  ["paid","Payée"],
  ["preparing","Préparation"],
  ["shipped","Expédiée"],
  ["delivered","Livrée"],
  ["canceled","Annulée"],
];

/* ----- CSRF utils ----- */
function getCookie(name){
  const m = document.cookie.match(new RegExp("(^| )"+name+"=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : "";
}
async function fetchWithCsrf(url, opts={}){
  const token = getCookie("csrf_token");
  const headers = { "Content-Type":"application/json", ...(opts.headers||{}), "x-csrf-token": token };
  return fetch(url, { credentials:"include", ...opts, headers });
}

function StatusCell({ order, onChanged }){
  const [draft, setDraft] = useState(order.status || "paid");
  const [busy, setBusy] = useState(false);

  // champs tracking quand on passe à "shipped"
  const [carrier, setCarrier] = useState(order.tracking?.carrier || "");
  const [number, setNumber] = useState(order.tracking?.number || "");
  const [url, setUrl] = useState(order.tracking?.url || "");

  async function apply(){
    try{
      setBusy(true);
      const body = { status: draft };
      if (draft === "shipped") {
        body.tracking = {
          carrier: carrier.trim(),
          number: number.trim(),
          url: url.trim()
        };
      }
      const r = await fetchWithCsrf(`${API_BASE}/admin/orders/${order.id}/status`, {
        method: "PATCH",
        body: JSON.stringify(body)
      });
      const data = await r.json().catch(()=> ({}));
      if(!r.ok) throw new Error(data.error || "Échec mise à jour");
      onChanged?.(order.id, data.status, data.tracking);
    }catch(e){
      alert(e.message);
    }finally{
      setBusy(false);
    }
  }

  const badgeColor =
    (order.status === "delivered" && "#059669") ||
    (order.status === "shipped"   && "#2563eb") ||
    (order.status === "preparing" && "#f59e0b") ||
    (order.status === "canceled"  && "#b91c1c") ||
    "#6b7280";

  return (
    <div style={{display:"grid", gap:8}}>
      <div style={{display:"flex", gap:8, alignItems:"center", flexWrap:"wrap"}}>
        <select value={draft} onChange={e=>setDraft(e.target.value)} style={{ padding: "6px 8px" }}>
          {ORDER_STATUSES.map(([val,label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <button onClick={apply} disabled={busy}>OK</button>
        <span style={{ padding:"2px 8px", borderRadius:999, fontSize:12, color:"#fff", background: badgeColor }}>
          {order.status || "paid"}
        </span>
      </div>

      {/* Si on choisit “Expédiée”, on affiche les champs de suivi */}
      {draft === "shipped" && (
        <div style={{display:"grid", gap:6, background:"#fafafa", border:"1px solid #eee", borderRadius:8, padding:8}}>
          <div style={{display:"grid", gap:6}}>
            <input placeholder="Transporteur (ex: Bpost / Colissimo / DHL…)"
                   value={carrier} onChange={(e)=>setCarrier(e.target.value)} />
            <input placeholder="Numéro de suivi"
                   value={number} onChange={(e)=>setNumber(e.target.value)} />
            <input placeholder="Lien de suivi"
                   value={url} onChange={(e)=>setUrl(e.target.value)} />
          </div>
          <small style={{color:"#6b6b6b"}}>
            Ces informations seront enregistrées sur la commande et (si configuré côté serveur) envoyées par email au client.
          </small>
        </div>
      )}
    </div>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [err, setErr] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      setErr("");
      setLoading(true);
      const r = await fetchWithCsrf(`${API_BASE}/admin/orders`);
      if (!r.ok) throw new Error("API commandes indisponible");
      const data = await r.json();
      setOrders(data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const totalCA = useMemo(
    () => orders.reduce((s, o) => s + (o.amount_total || 0), 0),
    [orders]
  );

  async function exportCSV() {
    try {
      const url = new URL(`${API_BASE}/admin/orders.csv`);
      if (from) url.searchParams.set("from", from);
      if (to) url.searchParams.set("to", to);

      const r = await fetchWithCsrf(url.toString());
      if (!r.ok) throw new Error("Échec export CSV");
      const blob = await r.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      a.download = `orders-${stamp}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <main style={{ width: "90%", margin: "0 auto", padding: "24px 0" }}>
      <h1>Admin — Commandes</h1>

      {err && <p style={{ color: "#c33" }}>{err}</p>}

      <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "12px 0 18px" }}>
        <div style={{ fontWeight: 700 }}>
          {orders.length} commande{orders.length > 1 ? "s" : ""} • CA total: {euro(totalCA)}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <label>
            Du&nbsp;
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label>
            au&nbsp;
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <button onClick={exportCSV}>Exporter CSV</button>
          <button onClick={load} disabled={loading}>{loading ? "Chargement…" : "Rafraîchir"}</button>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>
              <th style={{ padding: "10px 8px" }}>Date</th>
              <th style={{ padding: "10px 8px" }}>ID paiement</th>
              <th style={{ padding: "10px 8px" }}>Client (email)</th>
              <th style={{ padding: "10px 8px" }}>Montant</th>
              <th style={{ padding: "10px 8px" }}>Statut</th>
              <th style={{ padding: "10px 8px" }}>Articles</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} style={{ borderBottom: "1px solid #f0f0f0", verticalAlign:"top" }}>
                <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>
                  {fmtDate(o.createdAt || o.created_at || Date.now())}
                </td>
                <td style={{ padding: "10px 8px" }}>{o.id}</td>
                <td style={{ padding: "10px 8px" }}>{o.email || "—"}</td>
                <td style={{ padding: "10px 8px", fontWeight: 700 }}>{euro(o.amount_total || 0)}</td>
                <td style={{ padding: "10px 8px" }}>
                  <StatusCell
                    order={o}
                    onChanged={(id, status, tracking)=>{
                      setOrders(list => list.map(x => x.id === id ? { ...x, status, tracking: tracking ?? x.tracking } : x));
                    }}
                  />
                  {/* Affichage tracking s’il existe déjà */}
                  {o.tracking && (o.tracking.carrier || o.tracking.number || o.tracking.url) && (
                    <div style={{marginTop:8, fontSize:12, color:"#444"}}>
                      <div><b>Transporteur:</b> {o.tracking.carrier || "—"}</div>
                      <div><b>N°:</b> {o.tracking.number || "—"}</div>
                      {o.tracking.url && <a href={o.tracking.url} target="_blank" rel="noreferrer">Lien de suivi</a>}
                    </div>
                  )}
                </td>
                <td style={{ padding: "10px 8px" }}>
                  {Array.isArray(o.items) && o.items.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {o.items.map((it, idx) => (
                        <li key={idx}>
                          {(it.name || `#${it.id}`)} × {it.qty}
                        </li>
                      ))}
                    </ul>
                  ) : Array.isArray(o.stripe_line_items) && o.stripe_line_items.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {o.stripe_line_items.map((li, idx) => (
                        <li key={idx}>{li.name} × {li.qty ?? li.quantity ?? 1}</li>
                      ))}
                    </ul>
                  ) : (
                    <span style={{ color: "#777" }}>—</span>
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && !loading && (
              <tr>
                <td colSpan={6} style={{ padding: "16px 8px", color: "#777" }}>
                  Aucune commande pour le moment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
