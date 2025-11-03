// src/pages/AdminReviews.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";

export default function AdminReviews(){
  const { adminListReviews, adminApproveReview } = useAuth();

  const [tab, setTab] = useState("pending"); // 'pending' | 'approved'
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(null);

  async function load(){
    try{
      setErr(""); setLoading(true);
      const data = await adminListReviews({ status: tab });
      setList(data);
    }catch(e){ setErr(e.message); }
    finally{ setLoading(false); }
  }

  useEffect(()=>{ load(); /* eslint-disable-next-line */ }, [tab]);

  async function approve(id){
    try{
      setBusy(id);
      await adminApproveReview(id);
      await load();
    }catch(e){
      alert(e.message);
    }finally{
      setBusy(null);
    }
  }

  return (
    <main style={{maxWidth: 980, margin:'24px auto', padding:'0 16px'}}>
      <h1>Admin — Avis</h1>
      <div style={{display:'flex', gap:8, margin:'12px 0'}}>
        <button onClick={()=>setTab('pending')} className={tab==='pending'?'btn-primary':'btn-ghost'}>En attente</button>
        <button onClick={()=>setTab('approved')} className={tab==='approved'?'btn-primary':'btn-ghost'}>Approuvés</button>
      </div>

      {err && <p style={{color:'#b91c1c'}}>{err}</p>}
      {loading ? <p>Chargement…</p> : (
        <div style={{display:'grid', gap:12}}>
          {list.map(r=>(
            <div key={r.id} style={{border:'1px solid #eee', borderRadius:12, padding:12, background:'#fff'}}>
              <div style={{display:'flex', justifyContent:'space-between', gap:12}}>
                <div>
                  <div style={{fontWeight:700}}>
                    {r.authorName || 'Client'} <span style={{color:'#6b7280'}}>({r.authorEmail})</span>
                  </div>
                  <div style={{fontSize:13, color:'#6b7280'}}>
                    Produit: {r.productId} • Note: {r.rating}/5
                  </div>
                  <div style={{whiteSpace:'pre-wrap', marginTop:8}}>{r.content}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  {r.approved ? (
                    <>
                      <div style={{fontSize:13, color:'#16a34a', fontWeight:700}}>APPRouvé</div>
                      <div style={{fontSize:12, color:'#6b7280'}}>Achat vérifié: {r.verifiedPurchase ? 'Oui' : 'Non'}</div>
                      <div style={{fontSize:12, color:'#6b7280'}}>Points: {r.pointsAwarded ? '10 crédités' : '—'}</div>
                    </>
                  ) : (
                    <button onClick={()=>approve(r.id)} disabled={busy===r.id} className="btn-primary">
                      {busy===r.id ? '…' : 'Approuver'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {list.length===0 && <p style={{color:'#6b7280'}}>Aucun élément.</p>}
        </div>
      )}
    </main>
  );
}
