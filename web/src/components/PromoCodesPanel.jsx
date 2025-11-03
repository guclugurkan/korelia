// src/components/PromoCodesPanel.jsx
import { useEffect, useState, useMemo } from "react";

export default function PromoCodesPanel({
  fetchCodes = null,
  fallbackCodes = [],
  refreshKey = 0,
  limit = 4,               // 👈 max d’éléments visibles (0 = pas de limite)
  showAllButton = true     // 👈 affiche le bouton “Tout afficher” si besoin
}){
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(!!fetchCodes);
  const [err, setErr] = useState("");
  const [showAll, setShowAll] = useState(false);

  // Recharge à chaque refreshKey et re-plie la liste
  useEffect(()=>{
    let alive = true;
    setShowAll(false);
    (async ()=>{
      if (!fetchCodes) { setCodes(fallbackCodes); return; }
      try{
        setErr(""); setLoading(true);
        const res = await fetchCodes(); // GET /me/promo-codes
        if (alive) setCodes(Array.isArray(res) ? res : []);
      }catch(e){
        if (alive){ setErr("Impossible de charger les codes promo"); setCodes(fallbackCodes); }
      }finally{
        if (alive) setLoading(false);
      }
    })();
    return ()=>{ alive = false; };
  }, [fetchCodes, fallbackCodes, refreshKey]);

  const visible = useMemo(()=>{
    if (showAll || !limit) return codes;
    return codes.slice(0, limit);
  }, [codes, showAll, limit]);

  return (
    <section>
      <div className="promo-head">
        <div className="promo-title">Codes promo</div>
      </div>

      {loading && <p className="small muted">Chargement des codes…</p>}
      {err && <p className="acc-alert error" style={{marginTop:8}}>{err}</p>}

      <div className="promo-list">
        {visible.length === 0 && !loading && <p className="small muted">Aucun code pour le moment.</p>}

        {visible.map((c)=>(
          <div key={`${c.code}-${c.created_at}`} className="promo-item">
            <div className="promo-code">{c.code}</div>
            <div className="promo-created">Créé le {formatDate(c.created_at)}</div>
            <div className={`promo-status ${c.active ? "active":"inactive"}`}>
              <span className="dot" />
              {c.active
                ? "Actif"
                : (c.times_redeemed && c.max_redemptions && c.times_redeemed >= c.max_redemptions)
                  ? "Utilisé"
                  : "Inactif"}
            </div>
          </div>
        ))}
      </div>

      {/* Bouton Tout afficher */}
      {showAllButton && !showAll && limit > 0 && codes.length > visible.length && (
        <div style={{marginTop:10}}>
          <button className="btn-ghost" onClick={()=>setShowAll(true)}>Tout afficher</button>
        </div>
      )}
    </section>
  );
}

function formatDate(d){
  try{
    const dt = new Date(d);
    return dt.toLocaleDateString("fr-FR",{ year:"numeric", month:"2-digit", day:"2-digit" });
  }catch{ return d; }
}
