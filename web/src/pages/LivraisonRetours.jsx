// src/pages/LivraisonRetours.jsx
import { useEffect } from "react";

import Footer from "../components/Footer";
import "./LivraisonRetours.css";
import SiteHeader from "../components/SiteHeader";

/** === À PERSONNALISER ICI === */
const CONTACT_EMAIL = "contact@korelia.be";
const RETURN_ADDRESS = `Korelia – Retours
Rue de l’Exemple 12
1000 Bruxelles
Belgique`;
/** =========================== */

const fmtEur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

const SHIPPING = {
  freeThresholdCents: 5000,   // 50 €
  standardCents: 490,         // 4,90 €
  expressCents: 990,          // 9,90 €
  countries: ["Belgique (BE)", "France (FR)", "Luxembourg (LU)"],
  eta: {
    standard: "2–4 jours ouvrés",
    express: "1–2 jours ouvrés"
  }
};

export default function LivraisonRetours() {
  // JSON-LD (SEO) : politique de retours + mini FAQ
  useEffect(() => {
    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "MerchantReturnPolicy",
      "name": "Politique de retours Korelia",
      "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
      "merchantReturnDays": 14,
      "returnMethod": "ReturnByMail",
      "returnFees": "https://schema.org/ReturnFeesCustomerResponsibility",
      "inStoreReturnHours": "00:00-00:00",
      "refundable": true,
      "applicableCountry": "BE",
      "returnShippingFeesAmount": {
        "@type": "MonetaryAmount",
        "currency": "EUR",
        "value": "À la charge du client sauf erreur de notre part"
      }
    });
    document.head.appendChild(ld);

    const faq = document.createElement("script");
    faq.type = "application/ld+json";
    faq.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Quels sont les délais de livraison ?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `Standard ${SHIPPING.eta.standard}, Express ${SHIPPING.eta.express}.`
          }
        },
        {
          "@type": "Question",
          "name": "Quel est le seuil de livraison offerte ?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `Livraison standard offerte dès ${fmtEur.format(SHIPPING.freeThresholdCents/100)} d’achats.`
          }
        },
        {
          "@type": "Question",
          "name": "Quel est le délai de rétractation ?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "14 jours à compter de la réception. Produits non ouverts, dans l’emballage d’origine."
          }
        }
      ]
    });
    document.head.appendChild(faq);

    return () => {
      document.head.removeChild(ld);
      document.head.removeChild(faq);
    };
  }, []);

  return (
    <main className="lr-wrap">
      <SiteHeader/>

      <header className="lr-hero">
        <h1>Livraison & Retours</h1>
        <p>Tout savoir sur nos délais, frais, suivi, retours et remboursements.</p>
      </header>

      {/* Sommaire */}
      <nav className="lr-toc" aria-label="Sommaire">
        <a href="#livraison">Livraison</a>
        <a href="#suivi">Suivi de commande</a>
        <a href="#emballage">Emballage & préparation</a>
        <a href="#retours">Retours</a>
        <a href="#retractation">Droit de rétractation (14 jours)</a>
        <a href="#remboursements">Remboursements</a>
        <a href="#contact">Besoin d’aide ?</a>
      </nav>

      <div className="lr-container">
        {/* LIVRAISON */}
        <section id="livraison" className="lr-sec">
          <h2>Livraison</h2>
          <p>
            Nous livrons actuellement en {SHIPPING.countries.join(", ")}. D’autres destinations arrivent bientôt.
          </p>

          <div className="lr-card">
            <h3>Délais estimés</h3>
            <ul className="lr-list">
              <li><strong>Standard :</strong> {SHIPPING.eta.standard}</li>
              <li><strong>Express :</strong> {SHIPPING.eta.express}</li>
            </ul>
            <p className="lr-muted tiny">Hors week-ends/jours fériés et périodes de forte affluence.</p>
          </div>

          <div className="lr-card">
            <h3>Frais de livraison</h3>
            <div className="lr-table">
              <div className="row head">
                <div>Mode</div><div>Montant</div><div>Conditions</div>
              </div>
              <div className="row">
                <div>Standard</div>
                <div>{fmtEur.format(SHIPPING.standardCents/100)}</div>
                <div>Offert dès {fmtEur.format(SHIPPING.freeThresholdCents/100)} d’achats</div>
              </div>
              <div className="row">
                <div>Express</div>
                <div>{fmtEur.format(SHIPPING.expressCents/100)}</div>
                <div>—</div>
              </div>
            </div>
            <p className="lr-muted tiny">Le montant exact est calculé à l’étape de paiement.</p>
          </div>
        </section>

        {/* SUIVI */}
        <section id="suivi" className="lr-sec">
          <h2>Suivi de commande</h2>
          <p>
            Dès que ta commande passe en “expédiée”, tu reçois un e-mail de confirmation avec (si disponible) un lien de suivi.
            Tu peux aussi consulter la page <a href="/suivi">Suivi de commande</a> en renseignant ton numéro de commande.
          </p>
          <ul className="lr-list">
            <li>Statut “en préparation” : nos équipes préparent ton colis.</li>
            <li>Statut “expédiée” : ton colis est remis au transporteur (lien de suivi si disponible).</li>
            <li>Statut “livrée” : le colis est indiqué comme distribué par le transporteur.</li>
          </ul>
        </section>

        {/* EMBALLAGE */}
        <section id="emballage" className="lr-sec">
          <h2>Emballage & préparation</h2>
          <p>
            Les produits sont conditionnés avec soin pour éviter les dommages (calage, protection). Nous limitons les plastiques et favorisons des matériaux recyclables quand c’est possible.
          </p>
        </section>

        {/* RETOURS */}
        <section id="retours" className="lr-sec">
          <h2>Retours</h2>
          <p>
            Tu disposes de <strong>14 jours</strong> après réception pour nous retourner un article non ouvert et dans son emballage d’origine. Les frais de retour sont à la charge du client, sauf erreur de notre part (produit endommagé/incorrect).
          </p>

          <div className="lr-steps">
            <div className="step">
              
              <div>
                <h3>Préviens-nous</h3>
                <p>Écris-nous à <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> en indiquant ton numéro de commande et le(s) article(s) concerné(s).</p>
              </div>
            </div>
            <div className="step">
             
              <div>
                <h3>Emballe et renvoie</h3>
                <p>Replace le produit non ouvert dans son emballage d’origine, bien protégé. Renvoie à l’adresse :</p>
                <pre className="addr">{RETURN_ADDRESS}</pre>
                <p className="lr-muted tiny">Garde la preuve de dépôt et un numéro de suivi si possible.</p>
              </div>
            </div>
            <div className="step">
              
              <div>
                <h3>Contrôle & remboursement</h3>
                <p>À réception et contrôle, nous procédons au remboursement (voir section ci-dessous) via le même moyen de paiement.</p>
              </div>
            </div>
          </div>

          <div className="lr-card">
            <h3>Cas particuliers</h3>
            <ul className="lr-list">
              <li><strong>Produit endommagé/incorrect :</strong> préviens-nous sous 48h après réception avec photos, on prend en charge les frais de retour ou on te renvoie le bon article.</li>
              <li><strong>Hygiène/Skincare :</strong> les produits ouverts/descellés ne sont pas repris (sauf défaut/erreur de notre part).</li>
              <li><strong>Packs :</strong> si un article d’un pack pose problème, contacte-nous : on traite au cas par cas.</li>
            </ul>
          </div>
        </section>

        {/* RÉTRACTATION */}
        <section id="retractation" className="lr-sec">
          <h2>Droit de rétractation (14 jours)</h2>
          <p>
            Conformément au droit européen, tu peux te rétracter dans un <strong>délai de 14 jours</strong> à compter de la réception, sans justification. Les produits doivent être non ouverts, dans leur état d’origine. Les frais de retour restent à ta charge (sauf erreur de notre part).
          </p>

          <details className="lr-details">
            <summary>Modèle de formulaire de rétractation (facultatif)</summary>
            <div className="lr-formula">
              <p>— À adresser par e-mail à <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> —</p>
              <pre>{`Je vous notifie par la présente ma rétractation du contrat portant sur la vente du/des produit(s) ci-dessous :
- Commande n° : ________
- Reçu le : ________
- Nom : ________
- Adresse : ________
- Date : ________`}</pre>
            </div>
          </details>
        </section>

        {/* REMBOURSEMENTS */}
        <section id="remboursements" className="lr-sec">
          <h2>Remboursements</h2>
          <ul className="lr-list">
            <li>Délai indicatif : <strong>5–10 jours ouvrés</strong> après réception et validation du retour au stock.</li>
            <li>Mode : via le même moyen de paiement (Stripe) que la commande initiale.</li>
            <li>Frais de livraison initiaux : remboursés uniquement si retour total pour erreur de notre part ou commande annulée avant expédition.</li>
          </ul>
        </section>

        {/* CONTACT */}
        <section id="contact" className="lr-sec">
          <h2>Besoin d’aide ?</h2>
          <p>
            Écris-nous à <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> ou passe par la page <a href="/contact">Contact</a>. On te répond sous 24–48h ouvrées.
          </p>
        </section>
      </div>

      <Footer/>
    </main>
  );
}
