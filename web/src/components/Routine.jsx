// Routine.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./Routine.css";
import { Link } from "react-router-dom";

export default function Routine() {
  const [tab, setTab] = useState("essentielle");
  const [page, setPage] = useState(0);
  const [openIndex, setOpenIndex] = useState(null); // pour mobile/clavier sur desktop view
  const PAGE_SIZE = 5;

  // DATA
  const data = useMemo(
    () => ({
      essentielle: [
        {
          title: "Nettoyant",
          img: "/img/routineimg/nettoyant/routineimg1.png",
          note: "Nettoie en douceur",
          when: "Matin & soir",
          qty: "Une noisette",
          how: "Masser 30–40s sur peau humide, rincer à l’eau tiède.",
          tip: "Évite l’eau trop chaude (dessèche).",
        },
        {
          title: "Toner",
          img: "/img/routineimg/toner/routineimg1.png",
          note: "Rééquilibre & prépare",
          when: "Matin & soir",
          qty: "3–5 gouttes",
          how: "Tapoter avec les mains ou coton doux jusqu’à absorption.",
          tip: "En peau sèche, fais 2 couches (layering).",
        },
        {
          title: "Sérum",
          img: "/img/routineimg/serum/routineimg1.png",
          note: "Actifs ciblés",
          when: "Matin & soir",
          qty: "2–3 gouttes",
          how: "Appliquer sur peau légèrement humide, masser doucement.",
          tip: "Applique du plus fluide au plus épais si tu combines.",
        },
        {
          title: "Crème hydratante",
          img: "/img/routineimg/creme/routineimg1.png",
          note: "Nourrit & scelle",
          when: "Matin & soir",
          qty: "Une noisette",
          how: "Réchauffer entre les doigts puis masser visage & cou.",
          tip: "En peau sèche : ajoute une 2ᵉ fine couche la nuit.",
        },
        {
          title: "SPF",
          img: "/img/routineimg/spf/routineimg1.png",
          note: "Protection UV (matin)",
          when: "Matin (dernier geste)",
          qty: "2 phalanges",
          how: "Appliquer uniformément visage, cou & oreilles.",
          tip: "Réappliquer toutes les 2–3h si exposition.",
        },
      ],
      matin: [
        {
          title: "Nettoyant moussant",
          img: "/img/routineimg/nettoyant/routineimg1.png",
          note: "Doux pour le matin",
          when: "Matin",
          qty: "Une noisette",
          how: "Masser 20–30s, rincer, sécher en tapotant.",
          tip: "Peaux très sèches : rincer à l’eau claire suffit parfois.",
        },
        {
          title: "Toner",
          img: "/img/routineimg/toner/routineimg1.png",
          note: "Hydrate léger",
          when: "Matin",
          qty: "3–4 gouttes",
          how: "Tapoter avec les mains; 1 couche suffit le matin.",
          tip: "Peaux mixtes : insiste sur les joues.",
        },
        {
          title: "Essence",
          img: "/img/routineimg/essence/routineimg1.png",
          note: "Hydratation profonde",
          when: "Matin (après toner)",
          qty: "3–4 gouttes",
          how: "Appliquer en pressions légères, sans frotter.",
          tip: "Idéal avant le maquillage pour un teint plus lisse.",
        },
        {
          title: "Sérum",
          img: "/img/routineimg/serum/routineimg1.png",
          note: "Cible vos besoins",
          when: "Matin",
          qty: "2–3 gouttes",
          how: "Du centre du visage vers l’extérieur, mouvements doux.",
          tip: "Niacinamide le matin = sébum + éclat maîtrisés.",
        },
        {
          title: "Contour des yeux",
          img: "/img/routineimg/contour-des-yeux/routineimg1.png",
          note: "Délicat & ciblé",
          when: "Matin",
          qty: "1/2 pompe",
          how: "Tapoter avec l’annulaire, sans tirer la peau.",
          tip: "Un contour hydratant lisse l’anti-cernes ensuite.",
        },
        {
          title: "Crème hydratante",
          img: "/img/routineimg/creme/routineimg1.png",
          note: "Confort & souplesse",
          when: "Matin",
          qty: "Une noisette",
          how: "Masser visage & cou, laisser pénétrer avant SPF.",
          tip: "Choisis une texture légère si ta zone T brille.",
        },
        {
          title: "SPF",
          img: "/img/routineimg/spf/routineimg1.png",
          note: "Indispensable",
          when: "Matin (dernier geste)",
          qty: "2 phalanges",
          how: "Uniformément, sans oublier oreilles & nuque.",
          tip: "Stick ou cushion pour ré-applications rapides.",
        },
      ],
      soir: [
        {
          title: "Huile nettoyante",
          img: "/img/routineimg/huile-nettoyante/routineimg1.png",
          note: "Démaquille & dissout le SPF",
          when: "Soir (1/2)",
          qty: "2–3 pressions",
          how: "Masser 60s sur peau sèche, émulsionner, rincer.",
          tip: "Idéal même sans maquillage si tu portes du SPF.",
        },
        {
          title: "Nettoyant moussant",
          img: "/img/routineimg/nettoyant/routineimg1.png",
          note: "Double nettoyage",
          when: "Soir (2/2)",
          qty: "Une noisette",
          how: "Masser 20–30s, rincer, sécher délicatement.",
          tip: "Choisis pH doux pour ne pas décaper.",
        },
        {
          title: "Exfoliant (1–2x/sem)",
          img: "/img/routineimg/exfoliant/routineimg1.png",
          note: "Lisse & illumine",
          when: "Soir, 1–2× semaine",
          qty: "1–2 pompes / disque",
          how: "Sur peau sèche, évite yeux & lèvres, ne rince pas (si lotion).",
          tip: "Espace les usages pour éviter l’irritation.",
        },
        {
          title: "Toner",
          img: "/img/routineimg/toner/routineimg1.png",
          note: "Rééquilibre",
          when: "Soir",
          qty: "3–5 gouttes",
          how: "Tapoter jusqu’à absorption, 1–2 couches selon besoin.",
          tip: "Compresse 2–3 min sur zones irritées (peau sensible).",
        },
        {
          title: "Essence",
          img: "/img/routineimg/essence/routineimg1.png",
          note: "Booster d'hydratation",
          when: "Soir (après toner)",
          qty: "3–4 gouttes",
          how: "Pressions légères, sans frotter.",
          tip: "Idéal avant rétinoïdes pour limiter l’inconfort.",
        },
        {
          title: "Sérum",
          img: "/img/routineimg/serum/routineimg1.png",
          note: "Traitement ciblé",
          when: "Soir",
          qty: "2–3 gouttes",
          how: "Zones de préoccupations (taches, rides, pores...).",
          tip: "Alterne les actifs (ex: rétinol un soir sur deux).",
        },
        {
          title: "Masque (1–2x/sem)",
          img: "/img/routineimg/mask/routineimg1.png",
          note: "Coup d'éclat",
          when: "Soir, 1–2× semaine",
          qty: "Une couche fine (sleeping) / 1 tissu",
          how: "15–20 min si tissu; laisser poser la nuit si sleeping.",
          tip: "Ne rince pas le tissu : tapote l’excédent.",
        },
        {
          title: "Contour des yeux",
          img: "/img/routineimg/contour-des-yeux/routineimg1.png",
          note: "Anti-poches/rides",
          when: "Soir",
          qty: "1/2 pompe",
          how: "Tapoter avec l’annulaire, de l’intérieur vers l’extérieur.",
          tip: "Retinal le soir = rides ciblées (progressivité!).",
        },
        {
          title: "Crème hydratante",
          img: "/img/routineimg/creme/routineimg1.png",
          note: "Scelle les soins",
          when: "Soir (dernier geste)",
          qty: "Noisette à généreuse",
          how: "Masser visage & cou; couche plus riche si peau sèche.",
          tip: "Option slugging : baume occlusif par-dessus (peau très sèche).",
        },
      ],
    }),
    []
  );

  const steps = data[tab];

  // pagination desktop
  const totalPages = Math.ceil(steps.length / PAGE_SIZE);
  useEffect(() => {
    setPage(0);
    setOpenIndex(null);
  }, [tab]);

  const start = page * PAGE_SIZE;
  const visible = steps.slice(start, start + PAGE_SIZE);

  const prevPage = () => setPage((p) => (p - 1 + totalPages) % totalPages);
  const nextPage = () => setPage((p) => (p + 1) % totalPages);

  // état "open" pour les détails (desktop et mobile rail)
  const toggleOpen = (idx) => {
    setOpenIndex((cur) => (cur === idx ? null : idx));
  };

  return (
    <div className="routine">
      {/* header */}
      <div className="bs-header">
        <h1 className="bs-title">Routine Skincare</h1>
      </div>

      {/* onglets */}
      <div className="tabs" role="tablist" aria-label="Choisir le type de routine">
        <button
          className={tab === "essentielle" ? "tab active" : "tab"}
          onClick={() => setTab("essentielle")}
          role="tab"
          aria-selected={tab === "essentielle"}
        >
          Essentielle
        </button>
        <button
          className={tab === "matin" ? "tab active" : "tab"}
          onClick={() => setTab("matin")}
          role="tab"
          aria-selected={tab === "matin"}
        >
          Complète – Matin
        </button>
        <button
          className={tab === "soir" ? "tab active" : "tab"}
          onClick={() => setTab("soir")}
          role="tab"
          aria-selected={tab === "soir"}
        >
          Complète – Soir
        </button>
      </div>

      {/*
        DESKTOP/TABLET VIEW (inchangé visuellement pour toi)
        - flèches gauche/droite
        - grille responsive
        - pagination par PAGE_SIZE
      */}
      <div className="routine-desktopView">
        <div className="routine-slider">
          {steps.length > PAGE_SIZE && (
            <button
              className="nav-arrow left"
              onClick={prevPage}
              aria-label="Étapes précédentes"
            >
              ‹
            </button>
          )}

          <div className="routine-grid">
            {visible.map((s, i) => {
              const globalIndex = start + i;
              const isOpen = openIndex === globalIndex;
              return (
                <div
                  key={globalIndex}
                  className={`card fade-in ${isOpen ? "open" : ""}`}
                >
                  <button
                    className="card-hit"
                    onClick={() => toggleOpen(globalIndex)}
                    aria-expanded={isOpen}
                    aria-controls={`details-${globalIndex}`}
                  >
                    <span className="sr-only">Afficher détails</span>
                  </button>

                  <div className="badge">{globalIndex + 1}</div>

                  <div className="mediaa">
                    <img src={s.img} alt={s.title} loading="lazy" />
                  </div>

                  <div className="body">
                    <h3 className="title">{s.title}</h3>
                    {s.note && <p className="note">{s.note}</p>}
                  </div>

                  <div
                    id={`details-${globalIndex}`}
                    className="details"
                    aria-hidden={!isOpen}
                  >
                    <div className="details-inner">
                      <p>
                        <strong>Quand :</strong> {s.when}
                      </p>
                      <p>
                        <strong>Combien :</strong> {s.qty}
                      </p>
                      <p>
                        <strong>Comment :</strong> {s.how}
                      </p>
                      <p className="tip">
                        <strong>Astuce :</strong> {s.tip}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {steps.length > PAGE_SIZE && (
            <button
              className="nav-arrow right"
              onClick={nextPage}
              aria-label="Étapes suivantes"
            >
              ›
            </button>
          )}
        </div>
      </div>

      {/*
        MOBILE VIEW
        - pas de flèches
        - pas de pagination
        - TOUTES les étapes dans un rail horizontal scrollable
        - cartes ~50% de largeur => 2 visibles
      */}
      <div className="routine-mobileView">
        <div className="routine-rail" role="list">
          {steps.map((s, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`card routine-rail-card ${isOpen ? "open" : ""}`}
              >
                <button
                  className="card-hit"
                  onClick={() => toggleOpen(idx)}
                  aria-expanded={isOpen}
                  aria-controls={`m-details-${idx}`}
                >
                  <span className="sr-only">Afficher détails</span>
                </button>

                <div className="badge">{idx + 1}</div>

                <div className="mediaa">
                  <img src={s.img} alt={s.title} loading="lazy" />
                </div>

                <div className="body">
                  <h3 className="title">{s.title}</h3>
                  {s.note && <p className="note">{s.note}</p>}
                </div>

                <div
                  id={`m-details-${idx}`}
                  className="details"
                  aria-hidden={!isOpen}
                >
                  <div className="details-inner">
                    <p>
                      <strong>Quand :</strong> {s.when}
                    </p>
                    <p>
                      <strong>Combien :</strong> {s.qty}
                    </p>
                    <p>
                      <strong>Comment :</strong> {s.how}
                    </p>
                    <p className="tip">
                      <strong>Astuce :</strong> {s.tip}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA packs */}
      <div className="cta-pack">
        <Link
          to="/catalogue?cat=pack&catLabel=pack"
          className="pack-btn1"
        >
          Découvrir nos Pack Routines
        </Link>
      </div>
    </div>
  );
}
