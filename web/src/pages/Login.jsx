import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import "./Login.css";

import HeaderAll from "../components/HeaderAll";
import Footer from "../components/Footer";
export default function Login(){
  const { login } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/mon-compte";

  const [form, setForm] = useState({ email:"", password:"" });
  const [err, setErr] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e){
    e.preventDefault();
    try{
      setErr("");
      setLoading(true);
      await login(form);
      nav(from, { replace: true });
    }catch(ex){
      setErr(ex.message || "Connexion impossible");
    }finally{
      setLoading(false);
    }
  }

  return (
    <main className="login-wrap">
      {<HeaderAll/>}
      <section className="login-card" aria-labelledby="login-title">
        <div className="form-side">
          <h1 id="login-title" className="form-title">Se connecter</h1>

          {err && <p className="form-error" role="alert">{err}</p>}

          <form onSubmit={submit} className="form-grid">
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
              <span>Mot de passe</span>
              <div className="pwd-box">
                <input
                  type={showPwd ? "text" : "password"}
                  placeholder="Votre mot de passe"
                  autoComplete="current-password"
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

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? "Connexion…" : "Connexion"}
            </button>

            <div className="links">
              <Link to="/forgot-password" className="link">Mot de passe oublié ?</Link>
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
