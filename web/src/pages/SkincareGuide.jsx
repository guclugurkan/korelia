// src/pages/SkincareGuide.jsx
import { Link } from "react-router-dom";
import HeaderAll from "../components/HeaderAll";
import Footer from "../components/Footer";
import "./SkincareGuide.css";

const QuizInline = ({ to="/quiz" }) => (
  <Link className="sgi-quizInline" to={to} aria-label="Faire le quiz pour connaître ma routine">
    ✨ Faire le quiz
  </Link>
);

export default function SkincareGuide() {
  return (
    <main className="sgi-wrap">
      <HeaderAll />

      {/* Hero */}
      <section className="sgi-hero">
        <div className="sgi-heroContent">
          <h1>Guide complet de la skincare coréenne</h1>
          <p>
            Comprends les étapes, choisis les bons produits et construis une routine
            simple, efficace et adaptée à ta peau. On t’accompagne pas à pas.
          </p>
          <div className="sgi-heroCtas">
            <Link to="/catalogue" className="sgi-btn sgi-btn--primary">Découvrir les produits</Link>
            <Link to="/composer-pack" className="sgi-btn sgi-btn--ghost">Composer mon pack</Link>
          </div>
        </div>
        <div className="sgi-heroMedia" aria-hidden>
          <img src="/img/guide/hero-kbeauty.jpg" alt="" />
        </div>
      </section>

      {/* Sommaire sticky */}
      <div className="sgi-container">
        <aside className="sgi-toc">
          <div className="sgi-tocBox">
            <div className="sgi-tocTitle">Sommaire</div>
            <nav>
              <a href="#c-questce">Qu’est-ce que la skincare coréenne ?</a>
              <a href="#c-bienfaits">Pourquoi ça marche ?</a>
              <a href="#c-etapes">Les étapes clés (en clair)</a>
              <a href="#c-types">Choisir selon ton type de peau</a>
              <a href="#c-erreurs">Erreurs courantes</a>
              <a href="#c-construire">Construire ta routine</a>
              <a href="#c-services">Nos services & avantages</a>
              <a href="#c-faq">FAQ rapide</a>
            </nav>
          </div>

          <div className="sgi-card sgi-highlight">
            <div className="sgi-hTitle">Nouveau ✨</div>
            <p>Crée ton pack sur-mesure et profite de <strong>-10%</strong> sur le total.</p>
            <Link to="/composer-pack" className="sgi-btn sgi-btn--primary sgi-btn--full">Composer mon pack</Link>
          </div>
        </aside>

        {/* Contenu principal */}
        <article className="sgi-content">

          <section id="c-questce" className="sgi-section">
            <h2>Qu’est-ce que la skincare coréenne&nbsp;?</h2>
            <p>
              La skincare coréenne (“K-Beauty”) est une approche en plusieurs étapes
              qui met l’accent sur la douceur, la régularité et la prévention.
              Plutôt que d’agresser la peau, on la <em>renforce</em> et on lui apporte
              ce dont elle a besoin : nettoyage délicat, hydratation progressive,
              actifs ciblés et protection quotidienne.
            </p>
            <QuizInline />
            <div className="sgi-grid2">
              <img className="sgi-img" src="/img/guide/kbeauty-shelf.jpg" alt="Produits skincare coréenne sur étagère" />
              <div className="sgi-protip">
                <div className="sgi-protipTag">Pro tip</div>
                <p>
                  Pas besoin de tout faire d’un coup ! Commence par 3–4 étapes
                  (nettoyant, toner, crème, SPF) et ajoute un sérum quand tu es à l’aise.
                </p>
              </div>
            </div>
          </section>

          <section id="c-bienfaits" className="sgi-section">
            <h2>Pourquoi ça marche&nbsp;? Les bienfaits</h2>
            <ul className="sgi-bullets">
              <li><strong>Hydratation par couches</strong> : ta peau reste confortable plus longtemps.</li>
              <li><strong>Actifs ciblés</strong> : niacinamide, BHA, rétinol doux… choisis selon ton objectif.</li>
              <li><strong>Barrière cutanée protégée</strong> : moins d’irritations, meilleure tolérance.</li>
              <li><strong>SPF quotidien</strong> : prévention taches, vieillissement prématuré.</li>
            </ul>
            <QuizInline />
          </section>

          <section id="c-etapes" className="sgi-section">
            <h2>Les étapes clés (en clair)</h2>
            <div className="sgi-steps">
              <div className="sgi-step">
                <div className="sgi-stepNum">1</div>
                <div className="sgi-stepBody">
                  <h3>Nettoyant</h3>
                  <p>Gel doux ou huile démaquillante : on nettoie sans décaper pour préserver la barrière.</p>
                </div>
              </div>
              <div className="sgi-step">
                <div className="sgi-stepNum">2</div>
                <div className="sgi-stepBody">
                  <h3>Toner / Essence</h3>
                  <p>Rééquilibre le pH et prépare la peau à recevoir le reste. Hydratation légère et rapide.</p>
                </div>
              </div>
              <div className="sgi-step">
                <div className="sgi-stepNum">3</div>
                <div className="sgi-stepBody">
                  <h3>Sérum</h3>
                  <p>Concentré d’actifs (éclat, taches, imperfections, anti-âge…). On cible un besoin à la fois.</p>
                </div>
              </div>
              <div className="sgi-step">
                <div className="sgi-stepNum">4</div>
                <div className="sgi-stepBody">
                  <h3>Crème</h3>
                  <p>Scelle l’hydratation. Texture gel pour peaux grasses, plus riche pour peaux sèches.</p>
                </div>
              </div>
              <div className="sgi-step">
                <div className="sgi-stepNum">5</div>
                <div className="sgi-stepBody">
                  <h3>SPF (matin)</h3>
                  <p>Indispensable chaque matin. C’est la meilleure “anti-âge” préventive.</p>
                </div>
              </div>
            </div>
            <div className="sgi-inlineCtas">
              <Link to="/catalogue" className="sgi-btn sgi-btn--ghost">Voir le catalogue</Link>
              <Link to="/composer-pack" className="sgi-btn sgi-btn--primary">Composer mon pack (-10%)</Link>
            </div>
          </section>

          <section id="c-types" className="sgi-section">
            <h2>Choisir selon ton type de peau</h2>
            <div className="sgi-cards">
              <div className="sgi-card">
                <h3>Peau sèche</h3>
                <p>Priorité : confort & barrière. Cherche les textures crémeuses, céramides, acide hyaluronique.</p>
                <Link to="/pack/pack-peau-seche" className="sgi-link">Voir le pack conseillé</Link>
              </div>
              <div className="sgi-card">
                <h3>Peau grasse / mixte</h3>
                <p>Priorité : équilibre & pores. Textures légères, BHA (salicylique), niacinamide.</p>
                <Link to="/catalogue?cat=toner" className="sgi-link">Toners régulateurs</Link>
              </div>
              <div className="sgi-card">
                <h3>Peau sensible</h3>
                <p>Priorité : apaiser. Centella, panthénol, cica. Introduis les actifs progressivement.</p>
                <Link to="/catalogue?q=centella" className="sgi-link">Produits apaisants</Link>
              </div>
              <div className="sgi-card">
                <h3>Peau terne / taches</h3>
                <p>Priorité : éclat & homogénéité. Vitamine C douce, arbutine, AHA/BHA avec modération.</p>
                <Link to="/catalogue?q=vitamine%20C" className="sgi-link">Coup d’éclat</Link>
              </div>
            </div>
            <QuizInline />
          </section>

          <section id="c-erreurs" className="sgi-section">
            <h2>Erreurs courantes (et comment les éviter)</h2>
            <div className="sgi-grid2">
              <img className="sgi-img" src="/img/guide/mistakes.jpg" alt="Erreurs routine skincare" />
              <ul className="sgi-bullets">
                <li><strong>Trop d’actifs d’un coup</strong> → Introduis 1 nouveauté à la fois (test 2–3 semaines).</li>
                <li><strong>Nettoyant agressif</strong> → Si ça tiraille, change de nettoyant avant tout.</li>
                <li><strong>Pas de SPF</strong> → Sans protection, les taches reviennent et la peau vieillit plus vite.</li>
                <li><strong>Routine instable</strong> → Reste simple et régulier, c’est la clé du résultat.</li>
              </ul>
            </div>
          </section>

          <section id="c-construire" className="sgi-section">
            <h2>Construire ta routine en 3 étapes</h2>
            <ol className="sgi-stepsList">
              <li>Commence simple : <em>Nettoyant → Toner → Crème → SPF</em>.</li>
              <li>Ajoute 1 sérum ciblé selon ton objectif (éclat, pores, anti-taches…).</li>
              <li>Observe ta peau 2–3 semaines avant de changer quelque chose.</li>
            </ol>
            <div className="sgi-inlineCtas">
              <Link to="/composer-pack" className="sgi-btn sgi-btn--primary">Composer mon pack (-10%)</Link>
              <Link to="/quiz" className="sgi-btn sgi-btn--ghost">Je fais le quiz</Link>
            </div>
          </section>

          <section id="c-services" className="sgi-section">
            <h2>Nos services & avantages</h2>
            <div className="sgi-services">
              <div className="sgi-service">
                <div className="sgi-serviceIcon">🧪</div>
                <h3>Quiz personnalisé</h3>
                <p>Réponds à quelques questions et reçois une recommandation adaptée.</p>
                <Link to="/quiz" className="sgi-link">Faire le quiz</Link>
              </div>
              <div className="sgi-service">
                <div className="sgi-serviceIcon">🎁</div>
                <h3>Packs -10%</h3>
                <p>Packs prêts à l’emploi ou personnalisés. Simples, efficaces et avantageux.</p>
                <Link to="/composer-pack" className="sgi-link">Composer un pack</Link>
              </div>
              <div className="sgi-service">
                <div className="sgi-serviceIcon">💎</div>
                <h3>Programme de points</h3>
                <p>Inscription, avis, achats : cumule des points et obtiens des réductions.</p>
                <Link to="/mon-compte" className="sgi-link">Voir mon compte</Link>
              </div>
              <div className="sgi-service">
                <div className="sgi-serviceIcon">📦</div>
                <h3>Livraison soignée</h3>
                <p>Expédition rapide et produits authentiques. Service client à l’écoute.</p>
                <Link to="/catalogue" className="sgi-link">Parcourir le catalogue</Link>
              </div>
            </div>
          </section>

          <section id="c-faq" className="sgi-section">
            <h2>FAQ rapide</h2>
            <details className="sgi-faq">
              <summary>Combien d’étapes faut-il vraiment ?</summary>
              <p>3–5 suffisent. Ajoute ensuite selon tes besoins (sérum ciblé, essence…).</p>
            </details>
            <details className="sgi-faq">
              <summary>En combien de temps verrai-je des résultats ?</summary>
              <p>Généralement 3–4 semaines pour l’hydratation, 6–8+ semaines pour les taches/texture.</p>
            </details>
            <details className="sgi-faq">
              <summary>Dois-je faire double nettoyage ?</summary>
              <p>Oui si tu portes maquillage/SPF tenaces. Sinon, un nettoyant doux suffit.</p>
            </details>
            <QuizInline />
          </section>

          <section className="sgi-ctaFinal">
            <h2>Prêt(e) à démarrer ?</h2>
            <div className="sgi-inlineCtas">
              <Link to="/composer-pack" className="sgi-btn sgi-btn--primary">Composer mon pack (-10%)</Link>
              <Link to="/catalogue" className="sgi-btn sgi-btn--ghost">Voir le catalogue</Link>
              <Link to="/quiz" className="sgi-btn sgi-btn--ghost">Faire le quiz</Link>
            </div>
          </section>
        </article>
      </div>

      <Footer />
    </main>
  );
}
