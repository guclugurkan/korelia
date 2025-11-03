// src/quiz/quizConfig.js
// ✅ Quiz simplifié, questions concrètes, compatibilité 100% avec ton composant

// Clés internes normalisées (inchangées)
export const TP = { SECHE: "seche", NORMALE: "normale", MIXTE: "mixte", GRASSE: "grasse" };
export const CONCERNS = {
  SENSIBLE: "sensible",
  DESHYDRATEE: "deshydratee",
  ACNE: "acne",
  PORES: "pores",
  TERNE: "terne_taches",
  MATURE: "mature",
};

/**
 * RATIONNEL
 * - 12 questions courtes, vocabulaire simple
 * - Chaque option pousse doucement un “type de peau” et/ou des préoccupations
 * - On propose souvent une option “Ça dépend / je ne sais pas” (ne biaise pas le score)
 * - On garde des incréments faibles (1–3) → résultat plus naturel, moins “tranché”
 */

const Q = [
  {
    id: "fin_journee",
    title: "En fin de journée, ta peau est plutôt…",
    options: [
      { label: "Qui tiraille / inconfortable", effects: { tp: { [TP.SECHE]: 2 }, concerns: { [CONCERNS.DESHYDRATEE]: 1 } } },
      { label: "Normale / confortable", effects: { tp: { [TP.NORMALE]: 1 } } },
      { label: "Brillante sur le front/nez (zone T)", effects: { tp: { [TP.MIXTE]: 2 } } },
      { label: "Brillante partout", effects: { tp: { [TP.GRASSE]: 2 } } },
    ],
  },
  {
    id: "apres_nettoyage",
    title: "Après le nettoyage, ta peau…",
    options: [
      { label: "Tire facilement", effects: { tp: { [TP.SECHE]: 2 }, concerns: { [CONCERNS.DESHYDRATEE]: 2 } } },
      { label: "Se sent bien", effects: { tp: { [TP.NORMALE]: 1 } } },
      { label: "Devient vite luisante", effects: { tp: { [TP.GRASSE]: 1, [TP.MIXTE]: 1 } } },
      { label: "Je ne sais pas / ça dépend", effects: {} },
    ],
  },
  {
    id: "pores_visibles",
    title: "Tes pores sont…",
    options: [
      { label: "Peu visibles", effects: { tp: { [TP.NORMALE]: 1, [TP.SECHE]: 1 } } },
      { label: "Visibles surtout sur la zone T", effects: { tp: { [TP.MIXTE]: 2 }, concerns: { [CONCERNS.PORES]: 1 } } },
      { label: "Assez visibles partout", effects: { tp: { [TP.GRASSE]: 2 }, concerns: { [CONCERNS.PORES]: 2 } } },
      { label: "Je ne sais pas", effects: {} },
    ],
  },
  {
    id: "boutons",
    title: "Les boutons / points noirs, c’est…",
    options: [
      { label: "Rare", effects: {} },
      { label: "Par périodes (surtout zone T)", effects: { tp: { [TP.MIXTE]: 1 }, concerns: { [CONCERNS.ACNE]: 2 } } },
      { label: "Souvent", effects: { tp: { [TP.GRASSE]: 2 }, concerns: { [CONCERNS.ACNE]: 3 } } },
      { label: "Je ne sais pas", effects: {} },
    ],
  },
  {
    id: "sensibilite",
    title: "Rougeurs, picotements ou réactions…",
    options: [
      { label: "Souvent", effects: { concerns: { [CONCERNS.SENSIBLE]: 3 } } },
      { label: "Parfois", effects: { concerns: { [CONCERNS.SENSIBLE]: 2 } } },
      { label: "Rarement / jamais", effects: {} },
    ],
  },
  {
    id: "apres_creme",
    title: "Après ta crème hydratante…",
    options: [
      { label: "Toujours besoin d’en remettre", effects: { tp: { [TP.SECHE]: 2 }, concerns: { [CONCERNS.DESHYDRATEE]: 2 } } },
      { label: "C’est bien équilibré", effects: { tp: { [TP.NORMALE]: 1 } } },
      { label: "Ça brille vite / sensation collante", effects: { tp: { [TP.GRASSE]: 2, [TP.MIXTE]: 1 } } },
      { label: "Je ne sais pas", effects: {} },
    ],
  },
  {
    id: "mi_journee",
    title: "Vers midi, ta zone T (front/nez/menton)…",
    options: [
      { label: "Reste confortable", effects: { tp: { [TP.NORMALE]: 1 } } },
      { label: "Légèrement brillante", effects: { tp: { [TP.MIXTE]: 2 } } },
      { label: "Très brillante", effects: { tp: { [TP.GRASSE]: 2 } } },
      { label: "Plutôt sèche", effects: { tp: { [TP.SECHE]: 1 } } },
    ],
  },
  {
    id: "saisons",
    title: "Ta peau réagit aux saisons…",
    options: [
      { label: "Hiver : tiraille / Été : ok", effects: { tp: { [TP.SECHE]: 2 }, concerns: { [CONCERNS.DESHYDRATEE]: 1 } } },
      { label: "Hiver : ok / Été : plus de brillance", effects: { tp: { [TP.GRASSE]: 1, [TP.MIXTE]: 1 } } },
      { label: "Peu de variations", effects: { tp: { [TP.NORMALE]: 1 } } },
    ],
  },
  {
    id: "eclat",
    title: "Ton teint est…",
    options: [
      { label: "Lumineux / homogène", effects: {} },
      { label: "Un peu terne", effects: { concerns: { [CONCERNS.TERNE]: 2 } } },
      { label: "Avec taches / irrégularités", effects: { concerns: { [CONCERNS.TERNE]: 3 } } },
    ],
  },
  {
    id: "age_signes",
    title: "Signes du temps (rides/fermeté)…",
    options: [
      { label: "Peu / pas visible", effects: {} },
      { label: "Fines lignes visibles", effects: { concerns: { [CONCERNS.MATURE]: 2 } } },
      { label: "Rides marquées / perte de fermeté", effects: { concerns: { [CONCERNS.MATURE]: 3 } } },
    ],
  },
  {
    id: "tol_actifs",
    title: "Ta tolérance aux actifs (acides, Vit C, rétinoïdes)…",
    options: [
      { label: "Irritations faciles", effects: { concerns: { [CONCERNS.SENSIBLE]: 2 } } },
      { label: "Parfois", effects: { concerns: { [CONCERNS.SENSIBLE]: 1 } } },
      { label: "Ça va", effects: {} },
    ],
  },
  {
    id: "objectif",
    title: "Ton objectif prioritaire",
    options: [
      { label: "Hydrater / confort", effects: { tp: { [TP.SECHE]: 1 }, concerns: { [CONCERNS.DESHYDRATEE]: 2 } } },
      { label: "Moins de brillance / pores", effects: { tp: { [TP.GRASSE]: 2 }, concerns: { [CONCERNS.PORES]: 2 } } },
      { label: "Apaiser / réduire les rougeurs", effects: { concerns: { [CONCERNS.SENSIBLE]: 2 } } },
      { label: "Éclat / taches", effects: { concerns: { [CONCERNS.TERNE]: 2 } } },
      { label: "Anti-âge", effects: { concerns: { [CONCERNS.MATURE]: 2 } } },
    ],
  },
];

export default Q;
