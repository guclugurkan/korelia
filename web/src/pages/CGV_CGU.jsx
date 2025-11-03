// src/pages/CGV_CGU.jsx

import Footer from "../components/Footer";
import SiteHeader from "../components/SiteHeader";
import "./CGV_CGU.css";

export default function CGV_CGU() {
  return (
    <main className="legal-wrap">
      <SiteHeader />

      <header className="legal-hero">
        <h1>Conditions Générales de Vente (CGV) & d’Utilisation (CGU)</h1>
        <p>Veuillez lire attentivement ces conditions avant toute utilisation du site ou commande sur Korelia.</p>
      </header>

      <div className="legal-container">
        <section>
          <h2>1. Objet</h2>
          <p>
            Les présentes Conditions Générales de Vente (CGV) régissent les ventes conclues via le site
            <strong> korelia.be </strong>. Les Conditions Générales d’Utilisation (CGU) définissent les règles
            applicables à la navigation et l’utilisation du site.
          </p>
        </section>

        <section>
          <h2>2. Produits et prix</h2>
          <p>
            Les produits proposés sont décrits avec la plus grande exactitude possible. Les prix sont indiqués en euros TTC
            (toutes taxes comprises) hors frais de livraison. Korelia se réserve le droit de modifier ses prix à tout moment,
            tout en garantissant au client l’application du tarif en vigueur au moment de la commande.
          </p>
        </section>

        <section>
          <h2>3. Commande</h2>
          <p>
            Toute commande passée sur le site implique l’acceptation sans réserve des présentes CGV. Le client reçoit un e-mail
            de confirmation récapitulant sa commande.
          </p>
        </section>

        <section>
          <h2>4. Paiement</h2>
          <p>
            Les paiements sont sécurisés via Stripe. Les moyens acceptés : carte bancaire (Visa, Mastercard, Maestro),
            Bancontact, Apple Pay, Google Pay. La commande est considérée comme ferme après validation du paiement.
          </p>
        </section>

        <section>
          <h2>5. Livraison</h2>
          <p>
            Les commandes sont expédiées dans les délais indiqués sur la page Livraison & Retours. Les délais peuvent varier
            selon le transporteur. Korelia ne saurait être tenue responsable des retards imputables au transporteur.
          </p>
        </section>

        <section>
          <h2>6. Droit de rétractation</h2>
          <p>
            Conformément à la législation européenne, le client dispose d’un délai de 14 jours à compter de la réception pour
            exercer son droit de rétractation sans avoir à justifier de motifs ni à payer de pénalités, hors frais de retour.
          </p>
        </section>

        <section>
          <h2>7. Retours et remboursements</h2>
          <p>
            Les conditions de retour sont précisées sur la page Livraison & Retours. Les remboursements sont effectués via le
            moyen de paiement initial dans un délai de 5 à 10 jours ouvrés après validation.
          </p>
        </section>

        <section>
          <h2>8. Garanties légales</h2>
          <p>
            Les produits bénéficient de la garantie légale de conformité et de la garantie contre les vices cachés, conformément
            aux articles du Code de la consommation.
          </p>
        </section>

        <section>
          <h2>9. Utilisation du site (CGU)</h2>
          <p>
            L’utilisateur s’engage à ne pas utiliser le site à des fins frauduleuses, illégales ou portant atteinte à Korelia ou
            à des tiers. Les contenus (textes, images, logo) sont la propriété de Korelia et protégés par le droit de la
            propriété intellectuelle.
          </p>
        </section>

        <section>
          <h2>10. Données personnelles</h2>
          <p>
            Le traitement des données personnelles est détaillé dans notre page <a href="/confidentialite">Confidentialité &
            Cookies</a>. Korelia s’engage à respecter le RGPD et à protéger vos données.
          </p>
        </section>

        <section>
          <h2>11. Litiges</h2>
          <p>
            Les présentes CGV/CGU sont soumises au droit belge. En cas de litige, une solution amiable sera recherchée avant
            toute action judiciaire. À défaut, les tribunaux compétents seront ceux du ressort de Bruxelles.
          </p>
        </section>

        <section>
          <h2>12. Contact</h2>
          <p>
            Pour toute question, contactez-nous à l’adresse : <a href="mailto:contact@korelia.be">contact@korelia.be</a>.
          </p>
        </section>
      </div>

      <Footer />
    </main>
  );
}
