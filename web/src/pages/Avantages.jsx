// src/pages/Avantages.jsx
import HeaderAll from "../components/HeaderAll";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import "./Avantages.css";

export default function Avantages(){
  return (
    <main className="adv-wrap">
      <HeaderAll/>

      <section className="adv-hero">
        <div className="adv-hero-content">
          <h1>Avantages & Récompenses</h1>
          <p>Gagne des points à chaque action et transforme-les en remises, cadeaux et surprises 🎁</p>
          <div className="adv-cta">
            <Link to="/inscription" className="btn-primary">Créer mon compte (+50 pts)</Link>
            <Link to="/catalogue" className="btn-ghost">Découvrir le catalogue</Link>
          </div>
        </div>
        <div className="adv-hero-illu" aria-hidden>
          <img src="/img/loyalty/hero.jpg" alt="" onError={(e)=>e.currentTarget.style.display="none"} />
        </div>
      </section>

      {/* Système de points */}
      <section className="adv-block">
        <h2 className="adv-title">Comment gagner des points ?</h2>

        <div className="adv-grid three">
          <article className="adv-card">
            <div className="adv-icon" aria-hidden>💶</div>
            <h3>Achats</h3>
            <p><b>1€ = 1 point</b> sur tous les produits — promos incluses.</p>
            <div className="adv-tip">Ex : 35€ d’achat = <b>35 pts</b></div>
          </article>

          <article className="adv-card">
            <div className="adv-icon" aria-hidden>📝</div>
            <h3>Avis</h3>
            <p><b>+10 points</b> pour chaque avis publié.</p>
            <div className="adv-note">Anti-abus : 1 avis / produit / 24h.</div>
          </article>

          <article className="adv-card">
            <div className="adv-icon" aria-hidden>✨</div>
            <h3>Bienvenue</h3>
            <p><b>+50 points</b> dès l’inscription.</p>
            <div className="adv-tip">Crée ton compte en 1 minute.</div>
          </article>
        </div>
      </section>

      {/* Récompenses */}
      <section className="adv-block">
        <h2 className="adv-title">Convertir mes points en remises</h2>

        <div className="adv-rewards">
          <div className="reward">
            <div className="r-pts">100 pts</div>
            <div className="r-eq">=</div>
            <div className="r-amt">5€</div>
          </div>
          <div className="reward">
            <div className="r-pts">200 pts</div>
            <div className="r-eq">=</div>
            <div className="r-amt">12€</div>
          </div>
          <div className="reward">
            <div className="r-pts">500 pts</div>
            <div className="r-eq">=</div>
            <div className="r-amt">35€</div>
          </div>
        </div>

        <p className="adv-sub">Tu choisis la remise au moment du paiement (si ton solde le permet).</p>
      </section>

      {/* Cadeaux par palier d’achat */}
      <section className="adv-block">
        <h2 className="adv-title">Cadeaux offerts selon ton panier</h2>

        <div className="adv-grid gifts">
          <article className="gift-card">
            <div className="gift-img">
              <img src="/img/loyalty/gift-mask.jpg" alt="Masque offert" onError={(e)=>e.currentTarget.style.display="none"} />
              <span className="gift-badge">Dès 40€</span>
            </div>
            <div className="gift-meta">
              <h3>Masque tissu hydratant</h3>
              <p>Offert dès 40€ d’achat.</p>
            </div>
          </article>

          <article className="gift-card">
            <div className="gift-img">
              <img src="/img/loyalty/gift-minis.jpg" alt="Miniatures offertes" onError={(e)=>e.currentTarget.style.display="none"} />
              <span className="gift-badge">Dès 70€</span>
            </div>
            <div className="gift-meta">
              <h3>Duo de miniatures</h3>
              <p>2 miniatures (selon stock) dès 70€ d’achat.</p>
            </div>
          </article>

          <article className="gift-card">
            <div className="gift-img">
              <img src="/img/loyalty/gift-pouch.jpg" alt="Pochette skincare" onError={(e)=>e.currentTarget.style.display="none"} />
              <span className="gift-badge">Dès 100€</span>
            </div>
            <div className="gift-meta">
              <h3>Pochette skincare</h3>
              <p>Pochette + 1 mini supplémentaire dès 100€.</p>
            </div>
          </article>
        </div>

        <p className="adv-sub">Idées cadeaux modulables selon disponibilités (valeur équivalente garantie).</p>
      </section>

      {/* Exemples concrets */}
      <section className="adv-block">
        <h2 className="adv-title">Exemples concrets</h2>
        <div className="adv-examples">
          <div className="ex">
            <div className="ex-title">Premier achat 45€</div>
            <ul>
              <li>Points gagnés : <b>45 pts</b></li>
              <li>Cadeau : <b>1 masque</b> (≥ 40€)</li>
            </ul>
          </div>
          <div className="ex">
            <div className="ex-title">2 avis produits</div>
            <ul>
              <li>Points gagnés : <b>+20 pts</b></li>
            </ul>
          </div>
          <div className="ex">
            <div className="ex-title">Solde 115 pts</div>
            <ul>
              <li>Récompense possible : <b>5€</b> (100 pts)</li>
              <li>Reste <b>15 pts</b></li>
            </ul>
          </div>
        </div>
      </section>

      {/* Foire aux questions */}
      <section className="adv-block">
        <h2 className="adv-title">FAQ</h2>
        <div className="adv-faq">
          <details>
            <summary>Comment utiliser mes points ?</summary>
            <p>Au checkout : si tu as assez de points pour un palier, le bouton “Utiliser mes points” apparaît. Choisis 5€, 12€ ou 35€.</p>
          </details>
          <details>
            <summary>Les points expirent-ils ?</summary>
            <p>Non, pas d’expiration pour le moment.</p>
          </details>
          <details>
            <summary>Les avis sont-ils limités ?</summary>
            <p>+10 pts par avis, limité à 1 avis / produit / 24h afin d’éviter les abus.</p>
          </details>
          <details>
            <summary>Les cadeaux sont-ils cumulables avec les remises points ?</summary>
            <p>Oui : les cadeaux dépendent du montant du panier, la remise points s’applique séparément.</p>
          </details>
        </div>
      </section>

      {/* CTA final */}
      <section className="adv-final">
        <div className="adv-final-inner">
          <h2>Prêt·e à cumuler ?</h2>
          <p>Inscris-toi, commence à gagner des points et profite de cadeaux.</p>
          <div className="adv-cta">
            <Link to="/inscription" className="btn-primary">Créer mon compte</Link>
            <Link to="/catalogue" className="btn-ghost">Commencer mes achats</Link>
          </div>
        </div>
      </section>

      <Footer/>
    </main>
  );
}
