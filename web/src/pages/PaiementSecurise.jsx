// src/pages/PaiementSecurise.jsx
import { useEffect } from "react";
import Footer from "../components/Footer";
import "./PaiementSecurise.css";
import SiteHeader from "../components/SiteHeader";

/** === À PERSONNALISER ICI === */
const CONTACT_EMAIL = "contact@korelia.be";
const BRAND_NAME = "Korelia";
const ACCEPTED = [
  { key: "cb", label: "Cartes bancaires (Visa, Mastercard, Maestro)" },
  { key: "bancontact", label: "Bancontact" },
  { key: "applepay", label: "Apple Pay" },
  { key: "googlepay", label: "Google Pay" },
];
/** =========================== */

export default function PaiementSecurise() {
  // JSON-LD (FAQ) pour SEO
  useEffect(() => {
    const faq = document.createElement("script");
    faq.type = "application/ld+json";
    faq.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Quelles méthodes de paiement acceptez-vous ?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Cartes Visa, Mastercard, Maestro, Bancontact, Apple Pay et Google Pay via Stripe."
          }
        },
        {
          "@type": "Question",
          "name": "Mes données bancaires sont-elles stockées par la boutique ?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Non. Les informations de carte sont traitées par Stripe (prestataire certifié PCI-DSS). Nous n’y avons jamais accès."
          }
        },
        {
          "@type": "Question",
          "name": "Le paiement est-il sécurisé (3-D Secure) ?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Oui. Stripe déclenche l’authentification forte (3-D Secure) lorsque nécessaire, conformément à la DSP2."
          }
        },
        {
          "@type": "Question",
          "name": "Quand suis-je débité(e) ?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Au moment de la confirmation du paiement. En cas d’échec, aucune somme n’est débitée."
          }
        },
        {
          "@type": "Question",
          "name": "Comment se passe un remboursement ?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Les remboursements sont effectués sur le moyen de paiement d’origine (via Stripe). Le délai indicatif est de 5 à 10 jours ouvrés après validation."
          }
        }
      ]
    });
    document.head.appendChild(faq);
    return () => document.head.removeChild(faq);
  }, []);

  return (
    <main className="pay-wrap">
      <SiteHeader/>

      <header className="pay-hero">
        <h1>Paiement sécurisé</h1>
        <p>Des paiements rapides et protégés grâce à notre prestataire certifié.</p>
      </header>

      <div className="pay-container">
        {/* Moyens de paiement */}
        <section className="pay-sec">
          <h2>Méthodes acceptées</h2>
          <p>
            Sur {BRAND_NAME}, tes paiements passent par <strong>Stripe</strong>, l’un des leaders mondiaux du paiement en ligne.
          </p>
          <ul className="pay-logos" aria-label="Méthodes de paiement">
            {ACCEPTED.map((m) => (
              <li key={m.key} className={`logo ${m.key}`} title={m.label} aria-label={m.label}>
                <span>{m.label}</span>
              </li>
            ))}
          </ul>
          <p className="muted tiny">Apple Pay et Google Pay apparaissent quand ton appareil et ton navigateur sont compatibles.</p>
        </section>

        {/* Sécurité */}
        <section className="pay-sec">
          <h2>Ce qui protège tes paiements</h2>
          <div className="grid">
            <div className="card">
              <h3>Chiffrement & HTTPS</h3>
              <p>
                Toutes les pages de paiement sont servies en <strong>HTTPS</strong>. Les données sont chiffrées avant transmission.
              </p>
            </div>
            <div className="card">
              <h3>3-D Secure (DSP2)</h3>
              <p>
                Stripe active <strong>l’authentification forte</strong> (3-D Secure) quand c’est requis par ta banque, pour vérifier ton identité.
              </p>
            </div>
            <div className="card">
              <h3>Certification PCI-DSS</h3>
              <p>
                Stripe est certifié <strong>PCI-DSS niveau 1</strong>, le niveau de sécurité le plus élevé de l’industrie du paiement.
              </p>
            </div>
            <div className="card">
              <h3>Aucune carte stockée chez nous</h3>
              <p>
                {BRAND_NAME} <strong>ne voit ni ne stocke</strong> tes numéros de carte : tout est traité par Stripe.
              </p>
            </div>
            <div className="card">
              <h3>Prévention de la fraude</h3>
              <p>
                Stripe analyse les transactions en temps réel (détection d’anomalies, vérifications supplémentaires si nécessaire).
              </p>
            </div>
            <div className="card">
              <h3>Confidentialité</h3>
              <p>
                Tes informations de paiement ne sont <strong>jamais partagées</strong> avec des tiers non autorisés.
              </p>
            </div>
          </div>
        </section>

        {/* Déroulé d’un paiement */}
        <section className="pay-sec">
          <h2>Comment se déroule le paiement ?</h2>
          <ol className="steps">
            <li><strong>Panier & coordonnées :</strong> tu saisis tes infos de livraison.</li>
            <li><strong>Interface Stripe :</strong> tu choisis ta méthode (CB, Bancontact, Apple/Google Pay).</li>
            <li><strong>3-D Secure :</strong> si ta banque le demande, tu valides l’authentification.</li>
            <li><strong>Confirmation :</strong> si le paiement est accepté, tu reçois l’e-mail de confirmation.</li>
          </ol>
          <p className="muted tiny">En cas d’échec, vérifie tes informations et/ou contacte ta banque pour débloquer l’authentification forte.</p>
        </section>

        {/* Remboursements */}
        <section className="pay-sec">
          <h2>Remboursements</h2>
          <p>
            Les remboursements (retours, annulations) sont crédités sur <strong>le moyen de paiement d’origine</strong>. Délai indicatif : <strong>5–10 jours ouvrés</strong> après validation.  
            Consulte aussi la page <a href="/livraison">Livraison & Retours</a>.
          </p>
        </section>

        {/* Support */}
        <section className="pay-sec">
          <h2>Besoin d’aide ?</h2>
          <p>
            Une question sur un paiement ? Écris-nous à <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.  
            Nous répondons sous 24–48h ouvrées.
          </p>
        </section>

        {/* Mini FAQ visible (en plus du JSON-LD) */}
        <section className="pay-sec">
          <h2>FAQ Paiement</h2>
          <details className="qa">
            <summary>Quelles cartes acceptez-vous ?</summary>
            <p>Visa, Mastercard, Maestro. Nous proposons aussi Bancontact, Apple Pay et Google Pay.</p>
          </details>
          <details className="qa">
            <summary>Mon paiement a été refusé, que faire ?</summary>
            <p>
              Vérifie tes coordonnées, le plafond de ta carte, et l’activation de l’authentification
              forte (3-D Secure) côté banque. Réessaie ou contacte ta banque.
            </p>
          </details>
          <details className="qa">
            <summary>Le site stocke-t-il mes données bancaires ?</summary>
            <p>Non. Le traitement est effectué par Stripe (certifié PCI-DSS). Nous n’y avons jamais accès.</p>
          </details>
        </section>
      </div>

      <Footer/>
    </main>
  );
}
