// src/pages/QuizSkinType.jsx
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import HeaderAll from "../components/HeaderAll";
import Footer from "../components/Footer";
import Q, { TP, CONCERNS } from "../quiz/quizConfig";
import "./QuizSkinType.css";

const fmtLabel = {
  [TP.SECHE]: "Sèche",
  [TP.NORMALE]: "Normale",
  [TP.MIXTE]: "Mixte",
  [TP.GRASSE]: "Grasse",
  [CONCERNS.SENSIBLE]: "Sensible",
  [CONCERNS.DESHYDRATEE]: "Déshydratée",
  [CONCERNS.ACNE]: "Imperfections",
  [CONCERNS.PORES]: "Pores visibles",
  [CONCERNS.TERNE]: "Teint terne / taches",
  [CONCERNS.MATURE]: "Anti-âge",
};

const initialScores = {
  tp: { [TP.SECHE]:0, [TP.NORMALE]:0, [TP.MIXTE]:0, [TP.GRASSE]:0 },
  concerns: {
    [CONCERNS.SENSIBLE]:0,
    [CONCERNS.DESHYDRATEE]:0,
    [CONCERNS.ACNE]:0,
    [CONCERNS.PORES]:0,
    [CONCERNS.TERNE]:0,
    [CONCERNS.MATURE]:0,
  },
};

export default function QuizSkinType(){
  const [step, setStep] = useState(0); // index de question
  const [answers, setAnswers] = useState({}); // { [q.id]: idxOption }
  const [scores, setScores] = useState(initialScores);
  const [done, setDone] = useState(false);

  const nav = useNavigate();

  const total = Q.length;
  const progressPct = Math.round((Math.min(step, total) / total) * 100);

  const currentQ = Q[step];

  function applyEffects(effects){
    setScores(prev=>{
      const next = structuredClone(prev);
      if (effects?.tp) {
        for (const k in effects.tp) next.tp[k] = (next.tp[k]||0) + Number(effects.tp[k]||0);
      }
      if (effects?.concerns) {
        for (const k in effects.concerns) next.concerns[k] = (next.concerns[k]||0) + Number(effects.concerns[k]||0);
      }
      return next;
    });
  }

  function onSelect(optionIdx){
    if (!currentQ) return;
    const opt = currentQ.options[optionIdx];
    // si on change une réponse déjà donnée, on pourrait “rejouer” les effets différemment;
    // pour garder ça simple on n’autorise pas la modif rétroactive dans ce MVP.
    setAnswers(a => ({ ...a, [currentQ.id]: optionIdx }));
    applyEffects(opt.effects);

    if (step < total-1) setStep(step+1);
    else setDone(true);
  }

  const result = useMemo(()=>{
    if (!done) return null;

    // Type de peau
    const tpEntries = Object.entries(scores.tp).sort((a,b)=>b[1]-a[1]);
    const [tpTop, tpTopVal] = tpEntries[0];
    const sumTp = tpEntries.reduce((s, [,v])=>s+v, 0) || 1;
    const confidence = Math.max(1, Math.min(100, Math.round((tpTopVal / sumTp) * 100)));

    // “mixte tendance grasse” si serré
    let typePeau = tpTop;
    const second = tpEntries[1];
    if (second && (tpTopVal - second[1] <= 1) && ((tpTop===TP.MIXTE && second[0]===TP.GRASSE) || (tpTop===TP.GRASSE && second[0]===TP.MIXTE))) {
      typePeau = `${TP.MIXTE}+${TP.GRASSE}`; // pour le libellé en bas
    }

    // Concerns (seuil = 3)
    const concernEntries = Object.entries(scores.concerns)
      .filter(([,v])=>v>=3)
      .sort((a,b)=>b[1]-a[1])
      .slice(0,3)
      .map(([k])=>k);

    return { typePeau, confidence, concerns: concernEntries };
  }, [done, scores]);

  // suggestions pack simple (exemple – ajuste selon tes slugs)
  function getSuggestedPackSlug(r){
    if (!r) return null;
    const t = r.typePeau.includes("+") ? TP.MIXTE : r.typePeau;
    switch (t){
      case TP.SECHE:   return "pack-peau-seche-standard";
      case TP.MIXTE:   return "pack-peau-mixte-standard";
      case TP.GRASSE:  return "pack-peau-grasse-standard";
      default:         return "pack-peau-normale-standard";
    }
  }

  if (!done) {
    return (
      <main className="quiz-wrap">
        <HeaderAll/>

        <section className="quiz-container">
          <div className="quiz-head">
            <h1>Quiz — Connaître ton type de peau</h1>
            <p className="muted">Réponds simplement, on te guidera avec des conseils personnalisés.</p>
          </div>

          {/* Barre de progression */}
          <div className="quiz-progress" aria-label="Progression">
            <div className="bar">
              <div className="fill" style={{ width: `${progressPct}%` }}/>
            </div>
            <div className="hint">{step+1} / {total}</div>
          </div>

          {/* Question */}
          <div className="quiz-card">
            <div className="q-title">{currentQ.title}</div>
            <div className="q-options">
              {currentQ.options.map((opt, idx)=>(
                <button key={idx} className="q-btn" onClick={()=>onSelect(idx)}>
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="q-nav">
              <button
                className="btn-ghost"
                onClick={()=> setStep(s=> Math.max(0, s-1))}
                disabled={step===0}
              >
                ← Précédent
              </button>
              <div className="spacer"/>
              <button
                className="btn-ghost"
                onClick={()=> setStep(s=> Math.min(total-1, s+1))}
                disabled={typeof answers[currentQ.id] !== "number"}
              >
                Suivant →
              </button>
            </div>
          </div>
        </section>

        <Footer/>
      </main>
    );
  }

  // ----- RÉSULTAT -----
  const packSlug = getSuggestedPackSlug(result);
  const typeLabel = result.typePeau.includes("+")
    ? "Mixte (tendance grasse)"
    : fmtLabel[result.typePeau] || "Normale";

  return (
    <main className="quiz-wrap">
      <HeaderAll/>

      <section className="quiz-container">
        <div className="quiz-result card">
          <div className="res-top">
            <div className="res-kpi">
              <div className="res-label">Type de peau</div>
              <div className="res-value">{typeLabel}</div>
            </div>
            <div className="res-kpi">
              <div className="res-label">Confiance</div>
              <div className="res-value">{result.confidence}%</div>
            </div>
            <div className="res-kpi">
              <div className="res-label">Spécificités</div>
              <div className="res-tags">
                {result.concerns.length ? result.concerns.map(c=>(
                  <span key={c} className="tag">{fmtLabel[c]}</span>
                )) : <span className="muted">Aucune prioritaire</span>}
              </div>
            </div>
          </div>

          {/* Conseils rapides (exemples) */}
          <div className="res-advice">
            <h2>Conseils clés</h2>
            <ul>
              {result.typePeau.includes(TP.SECHE) && (
                <>
                  <li>Privilégie un nettoyant doux non asséchant.</li>
                  <li>Toner et sérum très hydratants (HA, panthénol).</li>
                  <li>Crème riche protectrice + SPF nourrissant.</li>
                </>
              )}
              {result.typePeau.includes(TP.GRASSE) && (
                <>
                  <li>Nettoyant doux + contrôle de sébum (sans décaper).</li>
                  <li>Niacinamide/BHA pour pores et brillances.</li>
                  <li>Hydratant gel-crème + SPF léger.</li>
                </>
              )}
              {result.typePeau.includes(TP.MIXTE) && (
                <>
                  <li>Équilibrer : doux sur les joues, ciblage zone T.</li>
                  <li>Niacinamide/BHA localement, hydratation globale.</li>
                  <li>Crème légère + SPF quotidien.</li>
                </>
              )}
              {result.concerns.includes(CONCERNS.SENSIBLE) && <li>Préférer des formules apaisantes (centella, cica), peu parfumées.</li>}
              {result.concerns.includes(CONCERNS.DESHYDRATEE) && <li>Multiplier les couches fines hydratantes (toner/essence/sérum HA).</li>}
              {result.concerns.includes(CONCERNS.TERNE) && <li>Envisager Vit C/arbutine (matin) + exfoliation douce (hebdo).</li>}
              {result.concerns.includes(CONCERNS.MATURE) && <li>Intégrer des actifs anti-âge (rétinoïdes progressifs le soir).</li>}
            </ul>
          </div>

          {/* CTA */}
          <div className="res-cta">
            {packSlug && (
              <Link to={`/pack/${packSlug}`} className="btn-primary">Voir le pack recommandé (-10%)</Link>
            )}
            <Link to="/composer-pack" className="btn-ghost">Composer mon pack (-10%)</Link>
            <Link to="/catalogue" className="btn-link">Parcourir le catalogue</Link>
          </div>

          {/* Bouton vers la page Guide + Quiz mini-CTA si tu veux l’inclure ailleurs */}
          <div className="res-more">
            <p className="muted">Envie d’en savoir plus ? Découvre notre <Link to="/guide-skincare">guide skincare coréenne</Link>.</p>
          </div>
        </div>
      </section>

      <Footer/>
    </main>
  );
}
