// src/pages/ResetPassword.jsx
import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./Login.css";
import HeaderAll from "../components/HeaderAll";
import Footer from "../components/Footer";

export default function ResetPassword(){
  const { resetPassword } = useAuth();
  const [params] = useSearchParams();
  const nav = useNavigate();

  const token = params.get("token") || "";
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    if(!token){
      setErr("Lien invalide : token manquant.");
    }
  },[token]);

  async function submit(e){
    e.preventDefault();
    if(!token) return;
    try{
      setErr("");
      if (pwd.length < 8) {
        setErr("Le mot de passe doit contenir au moins 8 caractères.");
        return;
      }
      if (pwd !== pwd2) {
        setErr("Les mots de passe ne correspondent pas.");
        return;
      }
      setLoading(true);
      await resetPassword(token, pwd);
      setOk(true);
      // (option) rediriger automatiquement vers la connexion après 2–3s
      setTimeout(()=> nav("/connexion"), 2000);
    }catch(ex){
      setErr(ex.message || "Réinitialisation impossible. Le lien a peut-être expiré.");
    }finally{
      setLoading(false);
    }
  }

  return (
    <main className="login-wrap">
      <HeaderAll/>

      <section className="login-card" aria-labelledby="rp-title">
        <div className="form-side">
          <h1 id="rp-title" className="form-title">Choisir un nouveau mot de passe</h1>

          {err && <p className="form-error" role="alert">{err}</p>}
          {ok && (
            <p className="form-error" style={{background:"#ecfdf3", borderColor:"#bbf7d0", color:"#166534"}}>
              Mot de passe réinitialisé ✅ Redirection vers la connexion…
            </p>
          )}

          <form onSubmit={submit} className="form-grid" noValidate>
            <label className="field">
              <span>Nouveau mot de passe (8+)</span>
              <div className="pwd-box">
                <input
                  type={showPwd ? "text" : "password"}
                  value={pwd}
                  onChange={e=>setPwd(e.target.value)}
                  placeholder="Au moins 8 caractères"
                  autoComplete="new-password"
                  minLength={8}
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

            <label className="field">
              <span>Confirmer le mot de passe</span>
              <div className="pwd-box">
                <input
                  type={showPwd2 ? "text" : "password"}
                  value={pwd2}
                  onChange={e=>setPwd2(e.target.value)}
                  placeholder="Ressaisissez le mot de passe"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="pwd-toggle"
                  onClick={()=>setShowPwd2(s=>!s)}
                  aria-label={showPwd2 ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  title={showPwd2 ? "Masquer" : "Afficher"}
                >
                  {showPwd2 ? "🙈" : "👁️"}
                </button>
              </div>
            </label>

            <button className="btn-primary" type="submit" disabled={loading || !token}>
              {loading ? "Mise à jour…" : "Mettre à jour mon mot de passe"}
            </button>

            <div className="links">
              <Link to="/connexion" className="link">← Retour à la connexion</Link>
              <span className="sep">•</span>
              <Link to="/inscription" className="link">Créer un compte</Link>
            </div>

            <div className="home-link">
              <Link to="/" className="btn-ghost">← Retour à l’accueil</Link>
            </div>
          </form>
        </div>
      </section>

      <Footer/>
    </main>
  );
}
