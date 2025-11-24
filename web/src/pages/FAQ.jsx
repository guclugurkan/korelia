// src/pages/FAQ.jsx
import { useEffect } from "react";

import Footer from "../components/Footer";
import "./FAQ.css";
import SiteHeader from "../components/SiteHeader";
import { Helmet } from 'react-helmet-async';

const SECTIONS = [
  {
    id: "commandes",
    title: "Commandes",
    faqs: [
      {
        q: "Comment passer une commande ?",
        a: "Ajoute tes produits au panier, clique sur “Passer au paiement”, puis suis l’étape Stripe. Tu recevras un e-mail de confirmation avec ton numéro de commande."
      },
      {
        q: "Je n’ai pas reçu l’e-mail de confirmation.",
        a: "Regarde d’abord dans tes spams. Si rien, contacte-nous à contact@korelia.be en indiquant ton nom et l’heure approximative de l’achat."
      },
      {
        q: "Puis-je modifier ou annuler ma commande ?",
        a: "Tant que la commande n’est pas passée en préparation, nous pouvons tenter une modification/annulation. Écris-nous le plus vite possible avec ton numéro de commande."
      },
    ],
  },
  {
    id: "livraison",
    title: "Livraison & suivi",
    faqs: [
      {
        q: "Quels sont les délais de livraison ?",
        a: "Standard 2–4 jours ouvrés, Express 1–2 jours ouvrés (hors périodes de forte affluence). Les délais s’affichent aussi dans Stripe."
      },
      {
        q: "Quels sont les frais de livraison ?",
        a: "Standard : 4,90 € (offert dès 50 € d’achats). Express : 9,90 €. Le montant exact apparaît au paiement."
      },
      {
        q: "Comment suivre mon colis ?",
        a: "Va sur la page Suivi de commande (/suivi) et entre ton numéro de commande. Dès l’expédition, un lien de tracking est affiché et envoyé par e-mail."
      },
      {
        q: "Livrez-vous à l’international ?",
        a: "Actuellement BE/FR/LU. D’autres pays arrivent. Écris-nous si tu as une demande spécifique."
      },
    ],
  },
  {
    id: "retours",
    title: "Retours & remboursements",
    faqs: [
      {
        q: "Puis-je retourner un produit ?",
        a: "Oui, sous 14 jours après réception, non ouvert et dans son emballage d’origine. Contacte-nous avant tout renvoi."
      },
      {
        q: "Frais de retour",
        a: "Les frais de retour sont à la charge du client, sauf erreur de notre part (produit endommagé/incorrect)."
      },
      {
        q: "Délais de remboursement",
        a: "Après réception et contrôle, nous remboursons sous 5–10 jours ouvrés via le moyen de paiement initial."
      },
    ],
  },
  {
    id: "paiement",
    title: "Paiement",
    faqs: [
      {
        q: "Quels moyens de paiement acceptez-vous ?",
        a: "Carte (Visa/Mastercard), et Bancontact. Le paiement est 100% sécurisé via Stripe."
      },
      {
        q: "Mon paiement a échoué",
        a: "Vérifie les fonds/autorisations 3-D Secure, retente, ou essaie un autre moyen de paiement. Si le problème persiste, contacte-nous."
      },
      {
        q: "Puis-je utiliser un code promo ?",
        a: "Oui. Entre ton code dans le panier ou directement dans Stripe. Vérifie les conditions (montant minimum, une seule utilisation…)."
      },
    ],
  },
  {
    id: "rewards",
    title: "Points & récompenses",
    faqs: [
      {
        q: "Comment gagner des points ?",
        a: "1 € dépensé = 1 point. +50 points à l’inscription, +10 points par avis (1 fois par produit et par 24h)."
      },
      {
        q: "Comment utiliser mes points ?",
        a: "Rends-toi dans ton compte → Récompenses. Échange tes points contre un code promo (ex : 100 pts = 5 € dès 30 €)."
      },
    ],
  },
  {
    id: "produits",
    title: "Produits & routines",
    faqs: [
      {
        q: "Vos produits sont-ils authentiques ?",
        a: "Oui, nous sourçons auprès de distributeurs officiels. Chaque référence est vérifiée avant mise en stock."
      },
      {
        q: "Comment choisir ma routine ?",
        a: "Tu peux nous écrire (contact@korelia.be) avec ton type de peau/objectif. On te conseille gratuitement."
      },
      {
        q: "Date d’expiration & conservation",
        a: "Chaque produit a une DDM/PAO. Range à l’abri de la chaleur et de la lumière. Évite la salle de bain trop humide."
      },
    ],
  },
  {
    id: "compte",
    title: "Compte & sécurité",
    faqs: [
      {
        q: "Dois-je créer un compte ?",
        a: "Non, tu peux commander en invité. Le compte permet de suivre l’historique, stocker l’adresse et profiter des points."
      },
      {
        q: "Mot de passe oublié",
        a: "Utilise “Mot de passe oublié” sur la page de connexion. Tu recevras un lien sécurisé pour le réinitialiser."
      },
      {
        q: "Protection de mes données",
        a: "Nous appliquons le RGPD. Consulte la page Confidentialité & cookies pour tous les détails."
      },
    ],
  },
];

function FAQItem({ id, q, a, defaultOpen = false }) {
  return (
    <details className="faq-item" id={id} open={defaultOpen}>
      <summary>
        <span className="q">{q}</span>
        <span className="chev" aria-hidden>▾</span>
      </summary>
      <div className="a">{a}</div>
    </details>
  );
}

function Section({ id, title, faqs }) {
  return (
    <section id={id} className="faq-sec">
      <h2>{title}</h2>
      {faqs.map((f, i) => (
        <FAQItem key={i} q={f.q} a={f.a} />
      ))}
    </section>
  );
}

export default function FAQ() {
  // JSON-LD FAQPage pour SEO
  useEffect(() => {
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": SECTIONS.flatMap(s =>
        s.faqs.map(f => ({
          "@type": "Question",
          "name": f.q,
          "acceptedAnswer": { "@type": "Answer", "text": f.a }
        }))
      )
    });
    document.head.appendChild(el);
    return () => { document.head.removeChild(el); };
  }, []);

  return (
    <main className="faq-wrap">


      <Helmet>
        <title>FAQ — Korelia</title>
        <meta
          name="description"
          content="Questions fréquentes : livraison, retours, paiement, conseils produits."
        />
        <link rel="canonical" href="https://korelia.be/faq" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="FAQ — Korelia" />
        <meta property="og:description" content="Toutes les réponses aux questions les plus fréquentes." />
        <meta property="og:url" content="https://korelia.be/faq" />
        <meta property="og:image" content="https://korelia.be/img/og-cover.jpg" />

        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>


      <SiteHeader/>

      <header className="faq-hero">
        <h1>FAQ — Foire aux questions</h1>
        <p>Livraison, retours, paiement, points, produits… On répond aux questions les plus fréquentes.</p>
      </header>

      {/* Sommaire */}
      <nav className="faq-toc" aria-label="Sommaire">
        {SECTIONS.map(s => (
          <a key={s.id} href={`#${s.id}`} className="toc-link">{s.title}</a>
        ))}
      </nav>

      <div className="faq-container">
        {SECTIONS.map(sec => (
          <Section key={sec.id} {...sec} />
        ))}
      </div>

      <section className="faq-cta">
        <h3>Tu n’as pas trouvé la réponse ?</h3>
        <p>
          Écris-nous à <a href="mailto:contact@korelia.be">contact@korelia.be</a> ou via la page{" "}
          <a href="/contact">Contact</a>. On te répond sous 24–48h ouvrées.
        </p>
      </section>

      <Footer/>
    </main>
  );
}
