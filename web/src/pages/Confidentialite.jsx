// src/pages/Confidentialite.jsx

import Footer from "../components/Footer";
import "./Confidentialite.css";
import SiteHeader from "../components/SiteHeader";

export default function Confidentialite() {
  return (
    <main className="privacy-wrap">
      <SiteHeader />

      <div className="privacy-hero">
        <h1>Confidentialité & Cookies</h1>
        <p>
          La protection de vos données personnelles est une priorité pour Korelia.
          Cette page explique quelles informations nous collectons, pourquoi et
          comment nous les utilisons.
        </p>
      </div>

      <div className="privacy-container1">
        <section>
          <h2>1. Responsable du traitement</h2>
          <p>
            Les données collectées sur ce site sont traitées par <strong>Korelia</strong>.
            Pour toute question, vous pouvez nous contacter à :
            <a href="mailto:contact@korelia.be"> contact@korelia.be</a>.
          </p>
        </section>

        <section>
          <h2>2. Données collectées</h2>
          <p>Nous collectons uniquement les données nécessaires :</p>
          <ul>
            <li>Informations de compte : nom, e-mail, mot de passe (haché).</li>
            <li>Informations de commande : adresse, téléphone, détails de livraison.</li>
            <li>Historique d’achats et préférences.</li>
            <li>Données techniques : cookies, adresse IP, logs de navigation.</li>
          </ul>
        </section>

        <section>
          <h2>3. Utilisation des données</h2>
          <p>Vos données sont utilisées pour :</p>
          <ul>
            <li>Traiter vos commandes et assurer la livraison.</li>
            <li>Gérer votre compte client.</li>
            <li>Vous envoyer des communications (confirmation, suivi, offres).</li>
            <li>Améliorer le site et l’expérience utilisateur.</li>
            <li>Respecter nos obligations légales (facturation, comptabilité).</li>
          </ul>
        </section>

        <section>
          <h2>4. Cookies</h2>
          <p>
            Nous utilisons des cookies pour améliorer votre navigation, sécuriser
            vos connexions et analyser le trafic. Vous pouvez configurer votre
            navigateur pour refuser les cookies, mais certaines fonctionnalités
            du site pourraient être limitées.
          </p>
        </section>

        <section>
          <h2>5. Partage des données</h2>
          <p>
            Vos données ne sont jamais revendues. Elles peuvent être partagées
            uniquement avec :
          </p>
          <ul>
            <li>Nos prestataires de paiement (Stripe).</li>
            <li>Nos transporteurs pour la livraison.</li>
            <li>Nos partenaires techniques (hébergement, maintenance).</li>
          </ul>
        </section>

        <section>
          <h2>6. Conservation</h2>
          <p>
            Vos données sont conservées le temps nécessaire pour remplir nos
            obligations légales et assurer le service (max. 3 ans après la fin
            de la relation commerciale).
          </p>
        </section>

        <section>
          <h2>7. Vos droits</h2>
          <p>Conformément au RGPD, vous pouvez :</p>
          <ul>
            <li>Accéder à vos données.</li>
            <li>Demander leur rectification ou suppression.</li>
            <li>Vous opposer à leur traitement (ex : prospection commerciale).</li>
            <li>Demander la portabilité de vos données.</li>
          </ul>
          <p>
            Pour exercer vos droits, contactez-nous à :
            <a href="mailto:contact@korelia.be"> contact@korelia.be</a>.
          </p>
        </section>

        <section>
          <h2>8. Sécurité</h2>
          <p>
            Nous mettons en place des mesures techniques et organisationnelles
            pour protéger vos données (chiffrement, sécurisation des accès,
            surveillance).
          </p>
        </section>

        <section>
          <h2>9. Modifications</h2>
          <p>
            Korelia se réserve le droit de modifier cette politique de
            confidentialité. Toute mise à jour sera publiée sur cette page.
          </p>
        </section>
      </div>

      <Footer />
    </main>
  );
}
