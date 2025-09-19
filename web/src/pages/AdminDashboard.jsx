// src/pages/AdminDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4242";

const euro = (cents) => (Number(cents || 0) / 100).toFixed(2) + " €";
const fmtDateTime = (iso) => new Date(iso).toLocaleString("fr-FR");
const fmtDate = (idYYYYMMDD) => {
  const d = new Date(idYYYYMMDD);
  if (!isFinite(d)) {
    // id str → "YYYY-MM-DD" : on laisse tel quel côté label
    return idYYYYMMDD;
  }
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
};

export default function AdminDashboard(){
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    let dead = false;
    (async ()=>{
      try{
        setLoading(true); setErr("");
        // ⬇️ nécessite d'être connecté en admin (JWT)
        const r = await fetch(`${API_BASE}/admin/stats`, { credentials: "include" });
        const json = await r.json().catch(()=> ({}));
        if(!r.ok) throw new Error(json.error || "API stats indisponible");
        if (!dead) setData(json);
      }catch(e){
        if (!dead) setErr(e.message);
      }finally{
        if (!dead) setLoading(false);
      }
    })();
    return ()=>{ dead = true; };
  },[]);

  const maxRev = useMemo(()=>{
    if (!data?.series_30d?.length) return 0;
    return Math.max(...data.series_30d.map(d=>d.revenue_cents||0), 0);
  }, [data]);

  return (
    <main style={{ maxWidth: 1100, margin: "24px auto", padding: "0 16px" }}>
      <h1>Admin — Tableau de bord</h1>

      {err && <p style={{ color:"#c33" }}>{err}</p>}
      {loading && <p>Chargement…</p>}
      {!loading && data && (
        <>
          {/* KPIs */}
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
            <KPI title="CA aujourd'hui" value={euro(data.kpis.revenue_today_cents)} sub={`${data.kpis.orders_today} commande(s)`}/>
            <KPI title="CA 7 jours" value={euro(data.kpis.revenue_7d_cents)} sub={`${data.kpis.orders_7d} commande(s)`}/>
            <KPI title="CA 30 jours" value={euro(data.kpis.revenue_30d_cents)} sub={`${data.kpis.orders_30d} commande(s)`}/>
            <KPI title="Panier moyen (30j)" value={euro(data.kpis.avg_order_30d_cents)} sub="moyenne brute"/>
          </section>

          {/* Courbe 30j revenue (barres simples) */}
          <section style={{ ...card, marginTop: 16 }}>
            <h2 style={{ margin: "0 0 12px" }}>Chiffre d’affaires — 30 derniers jours</h2>
            {!data.series_30d.length ? (
              <p style={{ color: "#6b7280" }}>Pas de données.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(30, 1fr)", gap: 4, alignItems: "end", height: 160 }}>
                {data.series_30d.map((d) => {
                  const pct = maxRev ? Math.max(6, Math.round((d.revenue_cents / maxRev) * 100)) : 0;
                  return (
                    <div key={d.id} title={`${fmtDate(d.id)} — ${euro(d.revenue_cents)} • ${d.orders} cmd`} style={{ display: "grid", gap: 4 }}>
                      <div style={{ background: "#111827", height: `${pct}%`, borderRadius: 6 }} />
                      <div style={{ fontSize: 10, textAlign: "center", color: "#6b7280" }}>{fmtDate(d.id).slice(0,5)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Top produits */}
          <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
            <div style={card}>
              <h3 style={{ marginTop: 0 }}>Top produits — Quantités</h3>
              <MiniTable
                headers={["Produit", "Qté", "CA"]}
                rows={data.top_by_qty.map(p => [p.name, p.qty, euro(p.revenue_cents)])}
                empty="Aucun produit."
              />
            </div>
            <div style={card}>
              <h3 style={{ marginTop: 0 }}>Top produits — Chiffre d’affaires</h3>
              <MiniTable
                headers={["Produit", "CA", "Qté"]}
                rows={data.top_by_revenue.map(p => [p.name, euro(p.revenue_cents), p.qty])}
                empty="Aucun produit."
              />
            </div>
          </section>

          {/* Dernières commandes */}
          <section style={{ ...card, marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 style={{ margin: 0 }}>Dernières commandes</h3>
              <Link to="/admin/orders" style={{ marginLeft: "auto", fontSize: 14 }}>Voir toutes &rarr;</Link>
            </div>
            <table style={{ width:"100%", borderCollapse:"collapse", marginTop: 8 }}>
              <thead>
                <tr style={{ textAlign:"left", borderBottom:"1px solid #eee" }}>
                  <th style={th}>Date</th>
                  <th style={th}>ID</th>
                  <th style={th}>Client</th>
                  <th style={th}>Montant</th>
                  <th style={th}>Statut</th>
                  <th style={th}>Articles</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_orders.map(o => (
                  <tr key={o.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                    <td style={td}>{fmtDateTime(o.createdAt)}</td>
                    <td style={td}>{o.id}</td>
                    <td style={td}>{o.email || "—"}</td>
                    <td style={{ ...td, fontWeight: 700 }}>{euro(o.amount_total)}</td>
                    <td style={td}>{o.payment_status}</td>
                    <td style={td}>{o.items_count}</td>
                  </tr>
                ))}
                {data.recent_orders.length === 0 && (
                  <tr><td colSpan={6} style={{ ...td, color:"#6b7280" }}>Aucune commande.</td></tr>
                )}
              </tbody>
            </table>
          </section>
        </>
      )}
    </main>
  );
}

function KPI({ title, value, sub }) {
  return (
    <div style={{ ...card, display:"grid", gap:6 }}>
      <div style={{ color:"#6b7280", fontSize:13, fontWeight:700, textTransform:"uppercase", letterSpacing:.4 }}>{title}</div>
      <div style={{ fontSize:26, fontWeight:800 }}>{value}</div>
      {sub && <div style={{ color:"#6b7280" }}>{sub}</div>}
    </div>
  );
}

function MiniTable({ headers, rows, empty }){
  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse" }}>
        <thead>
          <tr style={{ textAlign:"left", borderBottom:"1px solid #eee" }}>
            {headers.map((h,i)=><th key={i} style={th}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r,idx)=>(
            <tr key={idx} style={{ borderBottom:"1px solid #f7f7f7" }}>
              {r.map((cell,i)=><td key={i} style={td}>{cell}</td>)}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={headers.length} style={{ ...td, color:"#6b7280" }}>{empty}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const card = { border:"1px solid #eee", borderRadius:12, padding:16, background:"#fff" };
const th = { padding:"10px 8px", fontWeight:700, fontSize:13, color:"#6b7280" };
const td = { padding:"10px 8px", fontSize:14 };
