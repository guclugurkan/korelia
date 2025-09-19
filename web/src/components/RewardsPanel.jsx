import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";

const euro = (c) => (c/100).toFixed(2) + " €";
const fmtDate = (iso) => new Date(iso).toLocaleString();

export default function RewardsPanel(){
  const { user, fetchMyRewards, fetchRewardsCatalog, redeemReward } = useAuth();
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [history, setHistory] = useState([]);
  const [tiers, setTiers] = useState({});
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busyTier, setBusyTier] = useState("");

  useEffect(()=>{
    if (!user) return;
    (async ()=>{
      try{
        setErr(""); setMsg(""); setLoading(true);
        const [me, catalog] = await Promise.all([
          fetchMyRewards(),
          fetchRewardsCatalog()
        ]);
        setPoints(me.points || 0);
        setHistory(Array.isArray(me.history) ? me.history : []);
        setTiers(catalog || {});
      }catch(e){
        setErr(e.message || "Erreur chargement points");
      }finally{
        setLoading(false);
      }
    })();
  }, [user]);

  const tierList = useMemo(()=>{
    // transformer l'objet en liste triée par coût croissant
    return Object.entries(tiers)
      .map(([key, t])=> ({ key, ...t }))
      .sort((a,b)=> (a.cost - b.cost));
  }, [tiers]);

  async function claim(key){
    try{
      setErr(""); setMsg(""); setBusyTier(key);
      const res = await redeemReward(key);
      setMsg(`Code obtenu : ${res.code} (réduction ${euro(res.amount_off_cents)} dès ${euro(res.min_amount_cents)})`);
      // Recharge le solde/historique
      const me = await fetchMyRewards();
      setPoints(me.points || 0);
      setHistory(Array.isArray(me.history) ? me.history : []);
    }catch(e){
      setErr(e.message || "Récupération impossible");
    }finally{
      setBusyTier("");
    }
  }

  if (!user) return (
    <section style={box}>
      <h2>Programme de points</h2>
      <p>Connectez-vous pour voir vos points et réclamer des récompenses.</p>
    </section>
  );

  return (
    <section style={box}>
      <h2>Programme de points</h2>
      {loading ? <p>Chargement…</p> : (
        <>
          {err && <p style={{color:"#c33"}}>❌ {err}</p>}
          {msg && <p style={{color:"#0a7"}}>✅ {msg}</p>}

          <div style={pillRow}>
            <div style={pill}>
              <div style={pillLabel}>Mon solde</div>
              <div style={pillValue}>{points} pts</div>
            </div>
            <div style={{fontSize:14, color:"#666"}}>
              • 50 pts à l’inscription • 1 pt/€ dépensé • 10 pts par avis
            </div>
          </div>

          <h3 style={{marginTop:16}}>Récompenses disponibles</h3>
          <div style={grid}>
            {tierList.map(t=>(
              <div key={t.key} style={card}>
                <div style={{fontWeight:700, fontSize:16}}>{t.label}</div>
                <div style={{color:"#666", margin:"6px 0"}}>{t.cost} pts</div>
                <div style={{fontSize:14, marginBottom:10}}>
                  Réduction {euro(t.amount_off_cents)} dès {euro(t.min_amount_cents)}
                </div>
                <button
                  disabled={busyTier===t.key || points < t.cost}
                  onClick={()=>claim(t.key)}
                >
                  {points < t.cost ? "Points insuffisants" : (busyTier===t.key ? "Création..." : "Réclamer le code")}
                </button>
              </div>
            ))}
            {tierList.length === 0 && <p>Aucun palier défini.</p>}
          </div>

          <h3 style={{marginTop:16}}>Historique</h3>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%", borderCollapse:"collapse"}}>
              <thead>
                <tr style={{textAlign:"left", borderBottom:"1px solid #eee"}}>
                  <th style={th}>Date</th>
                  <th style={th}>Mouvement</th>
                  <th style={th}>Raison</th>
                </tr>
              </thead>
              <tbody>
                {history.map(h=>(
                  <tr key={h.id} style={{borderBottom:"1px solid #f5f5f5"}}>
                    <td style={td}>{fmtDate(h.at)}</td>
                    <td style={{...td, fontWeight:700, color: h.delta>=0 ? "#0a7" : "#c33"}}>
                      {h.delta>0 ? `+${h.delta}` : h.delta} pts
                    </td>
                    <td style={td}>{h.reason}</td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr><td style={td} colSpan={3}>Aucun mouvement pour l’instant.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

const box = { padding:"16px", border:"1px solid #eee", borderRadius:10, background:"#faf6f1" };
const grid = { display:"grid", gap:12, gridTemplateColumns:"repeat(auto-fill, minmax(220px,1fr))" };
const card = { border:"1px solid #eee", borderRadius:10, padding:12, background:"#fafafa" };
const th = { padding:"10px 8px" };
const td = { padding:"10px 8px", whiteSpace:"nowrap" };
const pillRow = { display:"flex", alignItems:"center", gap:12, marginBottom:8 };
const pill = { background:"#f1f5ff", border:"1px solid #dbe7ff", padding:"8px 12px", borderRadius:999 };
const pillLabel = { fontSize:12, color:"#375", textTransform:"uppercase", letterSpacing:0.3 };
const pillValue = { fontWeight:800, fontSize:16 };
