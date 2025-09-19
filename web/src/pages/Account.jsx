// src/pages/Account.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import VerifyEmailBanner from "../components/VerifyEmailBanner";
import RewardsPanel from "../components/RewardsPanel";
import OrdersPanel from "../components/OrdersPanel";
import HeaderAll from "../components/HeaderAll";
import Footer from "../components/Footer";
import "./Account.css";

export default function Account(){
  const { user, loading, logout, getAddress, saveAddress, updateProfileName, changePassword } = useAuth();

  const [addr, setAddr] = useState({ name:"", line1:"", line2:"", postal_code:"", city:"", country:"BE", phone:"" });
  const [profileName, setProfileName] = useState("");
  const [pwd, setPwd] = useState({ current_password:"", new_password:"" });

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // Drawer (panneau latéral) pour éditer les infos
  const [openDrawer, setOpenDrawer] = useState(false);

  useEffect(()=>{
    if (!loading && user) {
      setProfileName(user.name || "");
      (async ()=>{
        try {
          const a = await getAddress();
          if (a) setAddr(prev => ({ ...prev, ...a }));
        } catch {}
      })();
    }
  }, [loading, user]);

  if (loading) return <main style={{padding:24}}>Chargement…</main>;
  if (!user)   return <main style={{padding:24}}>Non connecté.</main>;

  // Sauvegardes (dans le drawer)
  async function saveAddressForm(e){
    e.preventDefault();
    try{
      setErr(""); setMsg(""); setBusy(true);
      const clean = { ...addr, country: (addr.country||'BE').toUpperCase() };
      await saveAddress(clean);
      setMsg("Adresse enregistrée ✅");
    }catch(ex){ setErr(ex.message || "Impossible d’enregistrer l’adresse"); }
    finally{ setBusy(false); }
  }
  async function saveName(e){
    e.preventDefault();
    try{
      setErr(""); setMsg(""); setBusy(true);
      await updateProfileName(profileName);
      setMsg("Nom de profil mis à jour ✅");
    }catch(ex){ setErr(ex.message || "Impossible de mettre à jour le nom"); }
    finally{ setBusy(false); }
  }
  async function savePassword(e){
    e.preventDefault();
    try{
      setErr(""); setMsg(""); setBusy(true);
      if ((pwd.new_password||"").length < 8) throw new Error("Mot de passe: 8+ caractères");
      await changePassword(pwd);
      setPwd({ current_password:"", new_password:"" });
      setMsg("Mot de passe changé ✅");
    }catch(ex){ setErr(ex.message || "Impossible de changer le mot de passe"); }
    finally{ setBusy(false); }
  }

  // Résumé lecture seule
  const infoRows = [
    ["Nom", user.name || "—"],
    ["Email", user.email],
    ["Adresse", [addr.line1, addr.line2].filter(Boolean).join(", ") || "—"],
    ["Code postal / Ville", [addr.postal_code, addr.city].filter(Boolean).join(" ") || "—"],
    ["Pays", addr.country || "—"],
    ["Téléphone", addr.phone || "—"],
  ];

  return (
    <main className="account-wrap">
      <HeaderAll/>

      <div className="account-container">
        {/* HERO */}
        <section className="acc-hero">
          <div className="avatar">{(user.name||user.email||"?").slice(0,1).toUpperCase()}</div>
          <div className="hero-meta">
            <h1 className="hero-title">{user.name || "Mon compte"}</h1>
            <div className="hero-sub">{user.email}</div>
          </div>
          <div className="hero-actions">
            <button className="btn-ghost" onClick={logout}>Se déconnecter</button>
            <Link to="/" className="btn-ghost">Accueil</Link>
          </div>
        </section>

        {/* Email non vérifié */}
        <VerifyEmailBanner/>

        {/* Quick actions */}
        <section className="card quick-actions">
          <div className="qa-title">Accès rapide</div>
          <div className="qa-grid">
            <Link className="qa-tile" to="/favoris">
              <div className="qa-emoji">🤍</div>
              <div className="qa-label">Mes favoris</div>
            </Link>
            <Link className="qa-tile" to="/panier">
              <div className="qa-emoji">🛒</div>
              <div className="qa-label">Mon panier</div>
            </Link>
          </div>
        </section>

        {/* Messages globaux */}
        {err && <p className="acc-alert error">{err}</p>}
        {msg && <p className="acc-alert ok">{msg}</p>}

        {/* Grille principale */}
        <div className="acc-grid">
          {/* Col gauche */}
          <div className="col">
            {/* Récompenses (habillage + ton RewardsPanel à l’intérieur) */}
            <section className="card rewards-shell">
              <div className="rewards-head">
                <div>
                  <h2 className="card-title">Points & Récompenses</h2>
                  <p className="muted small">Cumule des points à chaque commande et échange-les contre des codes promo.</p>
                </div>
                <div className="badge-soft">🎁</div>
              </div>
              <div className="rewards-body">
                <RewardsPanel/>
              </div>
            </section>

            {/* Commandes */}
            <OrdersPanel limit={3} showAllButton={true}/>
          </div>

          {/* Col droite */}
          <div className="col">
            {/* MES INFOS (lecture seule) */}
            <section className="card">
              <div className="card-head">
                <h2 className="card-title">Mes infos</h2>
                <button className="btn-ghost" onClick={()=>setOpenDrawer(true)}>Gérer mes infos</button>
              </div>
              <dl className="info-list">
                {infoRows.map(([k, v])=>(
                  <div key={k} className="info-row">
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="muted small">Pour modifier le nom, l’adresse ou le mot de passe, clique sur “Gérer mes infos”.</p>
            </section>

        
       
          </div>
        </div>
      </div>

      {/* DRAWER édition */}
      {openDrawer && (
        <>
          <div className="drawer-backdrop" onClick={()=>setOpenDrawer(false)} />
          <aside className="drawer">
            <div className="drawer-head">
              <h3>Gérer mes infos</h3>
              <button className="drawer-close" onClick={()=>setOpenDrawer(false)}>✕</button>
            </div>

            <div className="drawer-content">
              {/* Nom */}
              <section className="drawer-section">
                <h4>Profil</h4>
                <form onSubmit={saveName} className="form-grid">
                  <label className="field">
                    <span>Nom affiché</span>
                    <input value={profileName} onChange={e=>setProfileName(e.target.value)} placeholder="Ton nom"/>
                  </label>
                  <button className="btn-primary" type="submit" disabled={busy}>Enregistrer le nom</button>
                </form>
              </section>

              {/* Adresse */}
              <section className="drawer-section">
                <h4>Adresse de livraison</h4>
                <form onSubmit={saveAddressForm} className="form-grid">
                  <label className="field"><span>Nom complet</span><input value={addr.name} onChange={e=>setAddr({...addr, name:e.target.value})}/></label>
                  <label className="field"><span>Adresse (ligne 1)</span><input value={addr.line1} onChange={e=>setAddr({...addr, line1:e.target.value})}/></label>
                  <label className="field"><span>Complément</span><input value={addr.line2||""} onChange={e=>setAddr({...addr, line2:e.target.value})}/></label>
                  <div className="row2">
                    <label className="field"><span>Code postal</span><input value={addr.postal_code} onChange={e=>setAddr({...addr, postal_code:e.target.value})}/></label>
                    <label className="field"><span>Ville</span><input value={addr.city} onChange={e=>setAddr({...addr, city:e.target.value})}/></label>
                  </div>
                  <div className="row2">
                    <label className="field"><span>Pays</span><input value={addr.country} onChange={e=>setAddr({...addr, country:e.target.value})}/></label>
                    <label className="field"><span>Téléphone</span><input value={addr.phone||""} onChange={e=>setAddr({...addr, phone:e.target.value})}/></label>
                  </div>
                  <div className="drawer-actions">
                    <button className="btn-primary" type="submit" disabled={busy}>Enregistrer l’adresse</button>
                  </div>
                </form>
              </section>

              {/* Mot de passe */}
              <section className="drawer-section">
                <h4>Sécurité</h4>
                <form onSubmit={savePassword} className="form-grid">
                  <label className="field"><span>Mot de passe actuel</span><input type="password" value={pwd.current_password} onChange={e=>setPwd({...pwd, current_password:e.target.value})}/></label>
                  <label className="field"><span>Nouveau mot de passe (8+)</span><input type="password" minLength={8} value={pwd.new_password} onChange={e=>setPwd({...pwd, new_password:e.target.value})}/></label>
                  <div className="drawer-actions">
                    <button className="btn-primary" type="submit" disabled={busy}>Changer le mot de passe</button>
                  </div>
                </form>
              </section>
            </div>
          </aside>
        </>
      )}

      <Footer/>
    </main>
  );
}
