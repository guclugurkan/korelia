// src/pages/SkincareGuide.jsx
import { Link } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import "./SkincareGuide.css";

/* Petit bouton inline pour le quiz (réutilisable dans le texte) */
const QuizInline = ({ to = "/quiz" }) => (
  <Link className="sgi-quizInline" to={to} aria-label="Faire le quiz pour connaître ma routine">
    ✨ Faire le quiz
  </Link>
);

/* --- Bloc alterné image/texte (image carrée 1/1, look luxe) --- */
function Slab({ reverse = false, img, title, kicker = null, children, ctas = null }) {
  return (
    <section className={`sgi-slab ${reverse ? "sgi-slab--rev" : ""}`}>
      <div className="sgi-slabMedia" aria-hidden>
        <img className="sgi-img" src={img} alt="" />
      </div>
      <div className="sgi-slabBody">
        {kicker && <div className="sgi-slabKicker">{kicker}</div>}
        <h2 className="sgi-slabTitle">{title}</h2>
        <div className="sgi-slabText">{children}</div>
        {ctas && <div className="sgi-slabCtas">{ctas}</div>}
      </div>
    </section>
  );
}

export default function SkincareGuide() {
  return (
    <main className="sgi-wrap">
      <SiteHeader />

      {/* ---------- HERO ---------- */}
      <section className="sgi-hero">
        <div className="sgi-heroContent">
          <div className="sgi-eyebrow">K-Beauty • Guide expert</div>
          <h1>La skincare coréenne, simple & luxueuse</h1>
          <p>
            Comprends les étapes clés, choisis des formules adaptées, et construis une
            routine efficace qui respecte ta peau. On t’accompagne pas à pas, sans bla-bla.
          </p>
          <div className="sgi-heroCtas">
            <Link to="/catalogue" className="sgi-btn sgi-btn--primary">Découvrir les produits</Link>
            <Link to="/composer-pack" className="sgi-btn sgi-btn--ghost">Composer mon pack</Link>
            <Link to="/quiz" className="sgi-btn sgi-btn--ghost">Faire le quiz</Link>
          </div>
          <div className="sgi-heroNote">
            Packs <strong>3 produits</strong> : −5% &nbsp;•&nbsp; Packs <strong>5 produits</strong> : −10%
          </div>
        </div>
        <div className="sgi-heroMedia" aria-hidden>
          <img src="/img/guide-img/img1.png" alt="" />
        </div>
      </section>

      {/* ---------- LAYOUT PRINCIPAL ---------- */}
      <div className="sgi-container">
        {/* Sommaire sticky */}
        <aside className="sgi-toc">
          <div className="sgi-tocBox">
            <div className="sgi-tocTitle">Sommaire</div>
            <nav>
              <a href="#c-intro">Introduction</a>
              <a href="#c-bienfaits">Pourquoi ça marche</a>
              <a href="#c-etapes">Les 5 étapes</a>
              <a href="#c-types">Choisir selon ta peau</a>
              <a href="#c-erreurs">Erreurs courantes</a>
              <a href="#c-packs">Packs & avantages</a>
              <a href="#c-faq">FAQ rapide</a>
            </nav>
          </div>

          <div className="sgi-card sgi-highlight">
            <div className="sgi-hTitle">Nouveau ✨</div>
            <p>Crée ton pack sur-mesure et profite de <strong>−5%</strong> (3) ou <strong>−10%</strong> (5).</p>
            <Link to="/composer-pack" className="sgi-btn sgi-btn--primary sgi-btn--full">
              Composer mon pack
            </Link>
          </div>
        </aside>

        {/* Contenu principal */}
        <article className="sgi-content">

          {/* --- Bloc 1 : INTRO --- */}
          <section id="c-intro">
            <Slab
              img="/img/guide-img/img2.png"
              title="Qu’est-ce que la skincare coréenne ?"
              kicker="Introduction"
              ctas={
                <>
                  <Link to="/catalogue" className="sgi-btn sgi-btn--primary">Voir le catalogue</Link>
                  <Link to="/quiz" className="sgi-btn sgi-btn--ghost">Faire le quiz</Link>
                </>
              }
            >
              <p>
                La K-Beauty est une <strong>routine progressive</strong> qui fortifie durablement la
                barrière cutanée. On évite les chocs : on privilégie la <em>douceur</em>, la <em>régularité</em>,
                et des actifs <em>bien dosés</em>. Résultat : une peau plus stable, confortable et lumineuse.
              </p>
              <p>
                L’ordre type : nettoyage doux → hydratation par couches → actifs ciblés → protection UV.
                Tu peux garder la routine courte au quotidien et l’enrichir quand c’est pertinent.
                <QuizInline />
              </p>
            </Slab>
          </section>

          {/* --- Bloc 2 : BIENFAITS --- */}
          <section id="c-bienfaits">
            <Slab
              reverse
              img="/img/guide-img/img3.png"
              title="Pourquoi ça marche ? Hydratation, barrière, prévention."
              kicker="Les bienfaits"
              ctas={
                <>
                  <Link to="/composer-pack" className="sgi-btn sgi-btn--primary">Composer mon pack</Link>
                  <span className="sgi-pill">3 : −5% • 5 : −10%</span>
                </>
              }
            >
              <ul className="sgi-bullets">
                <li><strong>Hydratation continue</strong> : la peau reste souple et rebondie plus longtemps.</li>
                <li><strong>Actifs ciblés</strong> : on choisit un objectif (éclat, pores, taches…) pour de vrais résultats.</li>
                <li><strong>Barrière préservée</strong> : moins d’irritations, tolérance accrue, routine agréable.</li>
                <li><strong>SPF quotidien</strong> : anti-taches & anti-âge préventif. Indispensable le matin.</li>
              </ul>
            </Slab>
          </section>

          {/* --- Bloc 3 : ETAPES --- */}
          <section id="c-etapes">
            <Slab
              img="/img/guide-img/img4.png"
              title="Les 5 étapes claires (sans bla-bla)"
              kicker="Méthode"
              ctas={
                <>
                  <Link to="/catalogue?cat=nettoyant" className="sgi-btn sgi-btn--ghost">Voir les nettoyants</Link>
                  <Link to="/composer-pack" className="sgi-btn sgi-btn--primary">Créer mon pack</Link>
                </>
              }
            >
              <ol className="sgi-stepsList">
                <li><strong>Nettoyant</strong> (gel ou huile) — on nettoie sans décaper.</li>
                <li><strong>Toner / Essence</strong> — rééquilibre et prépare la peau.</li>
                <li><strong>Sérum</strong> — un objectif à la fois (éclat, pores, taches, anti-âge…).</li>
                <li><strong>Crème</strong> — scelle l’hydratation (gel léger ou texture riche selon peau).</li>
                <li><strong>SPF (matin)</strong> — la meilleure prévention, chaque jour.</li>
              </ol>
            </Slab>
          </section>

          {/* --- Bloc 4 : TYPES DE PEAU --- */}
          <section id="c-types">
            <Slab
              reverse
              img="/img/guide-img/img5.png"
              title="Choisir selon ton type de peau"
              kicker="Personnalisation"
              ctas={
                <>
                  <Link to="/quiz" className="sgi-btn sgi-btn--primary">Je fais le quiz</Link>
                  <Link to="/catalogue" className="sgi-btn sgi-btn--ghost">Parcourir le catalogue</Link>
                </>
              }
            >
              <div className="sgi-grid2 sgi-tight">
                <div className="sgi-card">
                  <h3>Peau sèche</h3>
                  <p>Priorité : confort & barrière. Céramides, bêta-glucan, textures riches.</p>
                  <Link to="/pack/pack-peau-seche-standard" className="sgi-link">Voir le pack conseillé</Link>
                </div>
                <div className="sgi-card">
                  <h3>Peau grasse / mixte</h3>
                  <p>Priorité : équilibre & pores. BHA, niacinamide, textures gel.</p>
                  <Link to="/catalogue?cat=toner" className="sgi-link">Toners régulateurs</Link>
                </div>
                <div className="sgi-card">
                  <h3>Peau sensible</h3>
                  <p>Priorité : apaiser. Centella, panthénol, actifs introduits progressivement.</p>
                  <Link to="/catalogue?q=centella" className="sgi-link">Produits apaisants</Link>
                </div>
                <div className="sgi-card">
                  <h3>Peau terne / taches</h3>
                  <p>Priorité : éclat & homogénéité. Vitamine C douce, AHA/BHA modérés.</p>
                  <Link to="/catalogue?q=vitamine%20C" className="sgi-link">Coup d’éclat</Link>
                </div>
              </div>
            </Slab>
          </section>

          {/* --- Bloc 5 : ERREURS --- */}
          <section id="c-erreurs">
            <Slab
              img="/img/guide-img/img6.png"
              title="Erreurs courantes (faciles à éviter)"
              kicker="Pro tips"
              ctas={
                <>
                  <Link to="/composer-pack" className="sgi-btn sgi-btn--primary">Composer mon pack</Link>
                  <Link to="/catalogue" className="sgi-btn sgi-btn--ghost">Voir les essentiels</Link>
                </>
              }
            >
              <ul className="sgi-bullets">
                <li><strong>Trop d’actifs d’un coup</strong> → Introduis 1 nouveauté à la fois (2–3 semaines).</li>
                <li><strong>Nettoyant agressif</strong> → Si ça tiraille, change de nettoyant avant tout.</li>
                <li><strong>SPF négligé</strong> → Sans SPF, les taches reviennent et la peau vieillit plus vite.</li>
                <li><strong>Routine instable</strong> → Reste simple et régulièr·e : c’est la clé.</li>
              </ul>
            </Slab>
          </section>

          {/* --- Bloc 6 : PACKS --- */}
          <section id="c-packs">
            <Slab
              reverse
              img="/img/compose-pack-img/pack-3-produit/img1.png"
              title="Packs prêts & packs personnalisés"
              kicker="Avantages"
              ctas={
                <>
                  <Link to="/pack" className="sgi-btn sgi-btn--ghost">Voir les packs prêts</Link>
                  <Link to="/composer-pack" className="sgi-btn sgi-btn--primary">Composer le mien</Link>
                  <span className="sgi-pill">3 produits : −5% • 5 produits : −10%</span>
                </>
              }
            >
              <p>
                Tu veux aller vite ? Choisis un pack prêt (peau sèche, grasse, sensible…).
                Tu veux du sur-mesure ? Compose ton pack <em>Essentiel (3)</em> ou <em>Standard (5)</em> et
                bénéficie automatiquement de la remise. Les produits restent visibles avec images,
                détails et filtre par type de peau pour un choix serein.
              </p>
            </Slab>
          </section>

          {/* --- FAQ --- */}
          <section id="c-faq" className="sgi-section">
            <h2 className="sgi-secTitle">FAQ rapide</h2>
            <details className="sgi-faq">
              <summary>Combien d’étapes faut-il vraiment ?</summary>
              <p>3–5 suffisent pour commencer : Nettoyant → Toner → Crème → SPF (+1 sérum ciblé selon besoin).</p>
            </details>
            <details className="sgi-faq">
              <summary>En combien de temps verrai-je des résultats ?</summary>
              <p>Hydratation : 3–4 semaines. Taches/texture : 6–8 semaines (parfois plus). Régularité = succès.</p>
            </details>
            <details className="sgi-faq">
              <summary>Dois-je faire double nettoyage ?</summary>
              <p>Oui si maquillage/SPF tenace. Sinon, un nettoyant doux suffit (le soir).</p>
            </details>
            <div className="sgi-inlineCtas">
              <Link to="/composer-pack" className="sgi-btn sgi-btn--primary">Composer mon pack</Link>
              <Link to="/quiz" className="sgi-btn sgi-btn--ghost">Faire le quiz</Link>
            </div>
          </section>

          {/* --- CTA FINAL --- */}
          <section className="sgi-ctaFinal">
            <h2>Prêt·e à démarrer une routine luxueuse & efficace ?</h2>
            <div className="sgi-inlineCtas">
              <Link to="/composer-pack" className="sgi-btn sgi-btn--primary">Composer mon pack (−5% / −10%)</Link>
              <Link to="/catalogue" className="sgi-btn sgi-btn--ghost">Parcourir le catalogue</Link>
              <Link to="/quiz" className="sgi-btn sgi-btn--ghost">Faire le quiz</Link>
            </div>
          </section>
        </article>
      </div>

      <Footer />
    </main>
  );
}
