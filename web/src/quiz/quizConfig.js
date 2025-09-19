// src/quiz/quizConfig.js

// clés internes normalisées
export const TP = { SECHE:"seche", NORMALE:"normale", MIXTE:"mixte", GRASSE:"grasse" };
export const CONCERNS = {
  SENSIBLE:"sensible",
  DESHYDRATEE:"deshydratee",
  ACNE:"acne",
  PORES:"pores",
  TERNE:"terne_taches",
  MATURE:"mature",
};

// Chaque question = { id, title, options: [{label, effects}] }
// effects: { tp?:{...}, concerns?:{...} } -> incrémente les scores
const Q = [
  {
    id: "brillance",
    title: "En fin de journée, ta peau…",
    options: [
      { label: "Tire, inconfortable", effects: { tp:{[TP.SECHE]:2} } },
      { label: "RAS / équilibrée", effects: { tp:{[TP.NORMALE]:1} } },
      { label: "Légèrement brillante sur la zone T", effects: { tp:{[TP.MIXTE]:2, [TP.GRASSE]:0} } },
      { label: "Brille sur tout le visage", effects: { tp:{[TP.GRASSE]:2} } },
    ],
  },
  {
    id: "pores",
    title: "Tes pores sont…",
    options: [
      { label: "Peu visibles", effects: { tp:{[TP.NORMALE]:1, [TP.SECHE]:1} } },
      { label: "Visibles sur la zone T", effects: { tp:{[TP.MIXTE]:2}, concerns:{pores:1} } },
      { label: "Assez visibles globalement", effects: { tp:{[TP.GRASSE]:2}, concerns:{pores:2} } },
    ],
  },
  {
    id: "tiraillements",
    title: "Après la douche ou le nettoyage…",
    options: [
      { label: "Ça tiraille souvent", effects: { tp:{[TP.SECHE]:2}, concerns:{deshydratee:2} } },
      { label: "Parfois", effects: { tp:{[TP.SECHE]:1}, concerns:{deshydratee:1} } },
      { label: "Rarement", effects: { tp:{[TP.NORMALE]:1} } },
      { label: "Jamais", effects: { tp:{[TP.GRASSE]:1, [TP.MIXTE]:1} } },
    ],
  },
  {
    id: "sensibilite",
    title: "Ta peau réagit (rougeurs, picotements)…",
    options: [
      { label: "Souvent", effects: { concerns:{sensible:3} } },
      { label: "Parfois", effects: { concerns:{sensible:2} } },
      { label: "Rarement", effects: { concerns:{sensible:1} } },
      { label: "Jamais", effects: { } },
    ],
  },
  {
    id: "imperfections",
    title: "Boutons / points noirs…",
    options: [
      { label: "Très rarement", effects: { } },
      { label: "Par périodes (zone T)", effects: { tp:{[TP.MIXTE]:2}, concerns:{acne:2} } },
      { label: "Fréquents", effects: { tp:{[TP.GRASSE]:2}, concerns:{acne:3} } },
    ],
  },
  {
    id: "eclat",
    title: "Ton teint est plutôt…",
    options: [
      { label: "Lumineux et homogène", effects: { } },
      { label: "Un peu terne", effects: { concerns:{terne_taches:2} } },
      { label: "Avec taches / irrégularités", effects: { concerns:{terne_taches:3} } },
    ],
  },
  {
    id: "mature",
    title: "Marques / fermeté…",
    options: [
      { label: "Non concerné", effects: { } },
      { label: "Fines lignes visibles", effects: { concerns:{mature:2} } },
      { label: "Rides marquées / perte de fermeté", effects: { concerns:{mature:3} } },
    ],
  },
  {
    id: "apres_creme",
    title: "Après ta crème hydratante…",
    options: [
      { label: "Vite absorbée, besoin de ré-appliquer", effects: { tp:{[TP.SECHE]:2}, concerns:{deshydratee:2} } },
      { label: "Bien équilibré", effects: { tp:{[TP.NORMALE]:1} } },
      { label: "Luisant / collant", effects: { tp:{[TP.GRASSE]:2, [TP.MIXTE]:1} } },
    ],
  },
  {
    id: "zoneT",
    title: "Zone T (front/nez/menton)…",
    options: [
      { label: "Sèche/inconfortable", effects: { tp:{[TP.SECHE]:1} } },
      { label: "Normale", effects: { tp:{[TP.NORMALE]:1} } },
      { label: "Légèrement brillante", effects: { tp:{[TP.MIXTE]:2} } },
      { label: "Très brillante", effects: { tp:{[TP.GRASSE]:2} } },
    ],
  },
  {
    id: "saisons",
    title: "En hiver / été, ta peau…",
    options: [
      { label: "Hiver : tiraille / Été : ok", effects: { tp:{[TP.SECHE]:2}, concerns:{deshydratee:1} } },
      { label: "Hiver : ok / Été : brille", effects: { tp:{[TP.GRASSE]:1, [TP.MIXTE]:1} } },
      { label: "Peu de variations", effects: { tp:{[TP.NORMALE]:1} } },
    ],
  },
  {
    id: "actifs",
    title: "Tolérance aux actifs (acides, Vit C, rétinoïdes)…",
    options: [
      { label: "Irritations faciles", effects: { concerns:{sensible:2} } },
      { label: "Parfois", effects: { concerns:{sensible:1} } },
      { label: "Ça va", effects: { } },
    ],
  },
  {
    id: "objectif",
    title: "Ton objectif prioritaire",
    options: [
      { label: "Hydrater / confort", effects: { tp:{[TP.SECHE]:1}, concerns:{deshydratee:2} } },
      { label: "Limiter brillance / pores", effects: { tp:{[TP.GRASSE]:2}, concerns:{pores:2} } },
      { label: "Apaiser / réduire rougeurs", effects: { concerns:{sensible:2} } },
      { label: "Éclat / taches", effects: { concerns:{terne_taches:2} } },
      { label: "Anti-âge", effects: { concerns:{mature:2} } },
    ],
  },
];

export default Q;
