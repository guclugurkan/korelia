// src/pages/MentionsLegales.jsx
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./MentionsLegales.css";
import SiteHeader from "../components/SiteHeader"

export default function MentionsLegales() {
  return (
    <main className="ml-wrap">
      <SiteHeader />

      <header className="ml-hero">
        <h1>Mentions légales</h1>
        <p>Informations relatives à l’éditeur du site, à l’hébergement et aux conditions d’utilisation.</p>
      </header>

      <div className="ml-container">
        <section>
          <h2>1. Éditeur du site</h2>
          <p>
            <strong>Dénomination&nbsp;:</strong> <span className="fill">KORELIA (NOM COMMERCIAL OU RAISON SOCIALE)</span><br/>
            <strong>Forme juridique&nbsp;:</strong> <span className="fill">SRL / SPRL / EI / ASBL …</span><br/>
            <strong>Siège social&nbsp;:</strong> <span className="fill">ADRESSE COMPLÈTE, CODE POSTAL, VILLE, PAYS</span><br/>
            <strong>N° d’entreprise (BCE)&nbsp;:</strong> <span className="fill">0XXX.XXX.XXX</span><br/>
            <strong>TVA&nbsp;:</strong> <span className="fill">BE0XXX.XXX.XXX</span><br/>
            <strong>Contact&nbsp;:</strong> <a href="mailto:contact@korelia.be">contact@korelia.be</a> – <span className="fill">+32 X XX XX XX XX</span>
          </p>
        </section>

        <section>
          <h2>2. Directeur·rice de la publication</h2>
          <p>
            <span className="fill">NOM PRÉNOM</span> – Représentant légal de <span className="fill">KORELIA</span>.
          </p>
        </section>

        <section>
          <h2>3. Hébergement</h2>
          <p>
            <strong>Hébergeur&nbsp;:</strong> <span className="fill">VERCEL / RENDER / AUTRE</span><br/>
            <strong>Adresse&nbsp;:</strong> <span className="fill">ADRESSE HÉBERGEUR</span><br/>
            <strong>Site&nbsp;:</strong> <a href="https://vercel.com" target="_blank" rel="noreferrer">vercel.com</a> / <a href="https://render.com" target="_blank" rel="noreferrer">render.com</a>
          </p>
        </section>

        <section>
          <h2>4. Support & réclamations</h2>
          <p>
            Pour toute question ou réclamation relative au site, aux produits ou aux commandes&nbsp;:
            <a href="mailto:contact@korelia.be"> contact@korelia.be</a>. Nous répondons sous 24–48h ouvrées.
          </p>
        </section>

        <section>
          <h2>5. Propriété intellectuelle</h2>
          <p>
            L’ensemble des contenus présents sur ce site (textes, images, logos, chartes graphiques, codes, etc.)
            est protégé par le droit d’auteur et le droit des marques. Toute reproduction, représentation,
            modification, publication, transmission, dénaturation, totale ou partielle, du site ou de son contenu,
            par quelque procédé que ce soit, et sur quelque support que ce soit, est interdite sans autorisation
            écrite préalable.
          </p>
        </section>

        <section>
          <h2>6. Liens externes</h2>
          <p>
            Le site peut contenir des liens vers des sites tiers. Nous ne pouvons en garantir l’exactitude,
            la sécurité ou le contenu. L’accès à ces sites se fait sous votre seule responsabilité.
          </p>
        </section>

        <section>
          <h2>7. Responsabilité</h2>
          <p>
            Nous mettons tout en œuvre pour assurer l’exactitude et la mise à jour des informations publiées.
            Toutefois, des erreurs ou omissions peuvent survenir&nbsp;: <strong>Korelia</strong> ne saurait être tenue
            responsable des dommages directs ou indirects résultant de l’utilisation du site.
          </p>
        </section>

        <section>
          <h2>8. Données personnelles</h2>
          <p>
            Le traitement des données est décrit dans notre page{" "}
            <a href="/confidentialite">Confidentialité & Cookies</a>. Conformément au RGPD, vous disposez de droits
            d’accès, rectification, opposition, limitation, portabilité et effacement. Vous pouvez exercer vos droits
            en nous écrivant à <a href="mailto:contact@korelia.be">contact@korelia.be</a>.
          </p>
        </section>

        <section>
          <h2>9. Cookies</h2>
          <p>
            Des cookies techniques et de mesure d’audience peuvent être déposés. Les modalités sont détaillées
            dans la page <a href="/confidentialite">Confidentialité & Cookies</a>.
          </p>
        </section>

        <section>
          <h2>10. Droit applicable & litiges</h2>
          <p>
            Le présent site est soumis au droit belge. En cas de litige, et à défaut de résolution amiable, les tribunaux
            compétents seront ceux de <span className="fill">VILLE / ARRONDISSEMENT</span>. Le recours à un service
            de médiation de la consommation est possible via{" "}
            <a href="https://mediationconsommateur.be" target="_blank" rel="noreferrer">
              https://mediationconsommateur.be
            </a>.
          </p>
        </section>

        <section>
          <h2>11. Modification des mentions</h2>
          <p>
            Les présentes mentions peuvent être mises à jour à tout moment, sans préavis. La dernière mise à jour fait foi.
          </p>
        </section>

        <section>
          <h2>12. Contact DPO (si applicable)</h2>
          <p>
            <strong>Délégué à la protection des données (DPO)&nbsp;:</strong>{" "}
            <span className="fill">NOM / CABINET (si désigné)</span> –{" "}
            <a href="mailto:dpo@korelia.be">dpo@korelia.be</a>.
          </p>
        </section>

        <div className="ml-updated">Dernière mise à jour&nbsp;: <span className="fill">JJ/MM/AAAA</span></div>
      </div>

      <Footer />
    </main>
  );
}
