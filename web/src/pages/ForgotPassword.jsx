// src/pages/ForgotPassword.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./Login.css";
import Footer from "../components/Footer";
import SiteHeader from "../components/SiteHeader";

export default function ForgotPassword(){
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e){
    e.preventDefault();
    try{
      setErr("");
      setLoading(true);
      // Réponse neutre (toujours { ok:true } côté front)
      await forgotPassword(email);
      setOk(true);
    }catch(ex){
      // Par sécurité on reste neutre, mais on affiche un message générique
      setOk(true);
    }finally{
      setLoading(false);
    }
  }

  return (
    <main className="login-wrap">
      <SiteHeader/>

      <section className="login-card" aria-labelledby="fp-title">
        <div className="form-side">
          <h1 id="fp-title" className="form-title">Mot de passe oublié</h1>

          {err && <p className="form-error" role="alert">{err}</p>}
          {ok && (
            <p className="form-error" style={{background:"#ecfdf3", borderColor:"#bbf7d0", color:"#166534"}}>
              Si un compte existe avec cet email, un lien de réinitialisation a été envoyé. Vérifie ta boîte mail.
            </p>
          )}

          <form onSubmit={submit} className="form-grid" noValidate>
            <label className="field">
              <span>Votre email</span>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="votre@email.com"
                value={email}
                onChange={e=>setEmail(e.target.value)}
                required
              />
            </label>

            <button className="btn-primary" type="submit" disabled={loading || !email}>
              {loading ? "Envoi…" : "Envoyer le lien de réinitialisation"}
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
