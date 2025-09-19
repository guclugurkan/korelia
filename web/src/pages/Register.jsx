// src/pages/Register.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import HeaderAll from "../components/HeaderAll";
import Footer from "../components/Footer";
import "./Login.css"; // on réutilise ton style doux

export default function Register(){
  const { register } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  // Prefill par query ?email=
  const sp = new URLSearchParams(location.search);
  const prefillEmail = sp.get("email") || "";

  const [form, setForm] = useState({ name:"", email: prefillEmail, password:"" });
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // Bandeau “on récupère tes points invités”
  const showBackfillBanner = Boolean(prefillEmail);

  async function submit(e){
    e.preventDefault();
    try{
      setErr(""); setInfo(""); setLoading(true);
      const u = await register(form);
      // Si l’API renvoie rewards_backfill, on informe l’utilisateur
      const bf = u?.rewards_backfill;
      if (bf && typeof bf.credited === "number") {
        if (bf.credited > 0) {
          setInfo(`Compte créé ✅ +${bf.credited} points récupérés de vos commandes passées.`);
        } else {
          setInfo("Compte créé ✅ Vos futurs achats cumuleront des points automatiquement.");
        }
      } else {
        setInfo("Compte créé ✅ Vérifiez votre email pour confirmer votre adresse.");
      }
      // Redirige après un court délai (option UX)
      setTimeout(()=> nav("/mon-compte"), 900);
    }catch(ex){
      setErr(ex.message || "Inscription échouée");
    }finally{
      setLoading(false);
    }
  }

  return (
    <main className="login-wrap">
      <HeaderAll/>

      <section className="login-card" aria-labelledby="register-title">
        <div className="form-side">
          <h1 id="register-title" className="form-title">Créer un compte</h1>

          {showBackfillBanner && (
            <div className="form-error" style={{ background:"#f0fdf4", borderColor:"#bbf7d0", color:"#14532d" }}>
              <strong>Bonne nouvelle !</strong> Si vous créez votre compte avec <em>{prefillEmail}</em>,
              nous créditerons automatiquement les points de vos achats passés.
            </div>
          )}

          {err && <p className="form-error" role="alert">{err}</p>}
          {info && <p className="form-error" style={{ background:"#eff6ff", borderColor:"#bfdbfe", color:"#1e3a8a" }}>{info}</p>}

          <form onSubmit={submit} className="form-grid">
            <label className="field">
              <span>Nom</span>
              <input
                placeholder="Votre nom"
                value={form.name}
                onChange={e=>setForm({...form, name:e.target.value})}
              />
            </label>

            <label className="field">
              <span>Email</span>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="votre@email.com"
                value={form.email}
                onChange={e=>setForm({...form, email:e.target.value})}
                required
              />
            </label>

            <label className="field">
              <span>Mot de passe (8+)</span>
              <div className="pwd-box">
                <input
                  type={showPwd ? "text" : "password"}
                  placeholder="Choisissez un mot de passe"
                  autoComplete="new-password"
                  minLength={8}
                  value={form.password}
                  onChange={e=>setForm({...form, password:e.target.value})}
                  required
                />
                <button
                  type="button"
                  className="pwd-toggle"
                  onClick={()=>setShowPwd(s=>!s)}
                  aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  title={showPwd ? "Masquer" : "Afficher"}
                >
                  {showPwd ? "🙈" : "👁️"}
                </button>
              </div>
            </label>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Création…" : "Créer mon compte"}
            </button>

            <div className="links">
              <Link to="/connexion" className="link">Déjà inscrit ? Se connecter</Link>
              <span className="sep">•</span>
              <Link to="/" className="link">Retour à l’accueil</Link>
            </div>
          </form>
        </div>
      </section>

      <Footer/>
    </main>
  );
}
