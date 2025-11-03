import React from "react";
import "./Footer.css";



const CONTACT_EMAIL = "contact@korelia.be";
const WHATSAPP_E164 = "+32400000000";

const PACK_GROUPS = [
  { group: "Peau Sèche", std: "pack-peau-seche-budget", full: "pack-peau-seche-complet" },
  { group: "Peau Grasse & Acnéique", std: "pack-peau-grasse-acneique-standard", full: "pack-peau-grasse-acneique-complet" },
  { group: "Peau Sensible", std: "pack-peau-sensible-standard", full: "pack-peau-sensible-complet" },
  { group: "Anti-Âge", std: "pack-anti-age-standard", full: "pack-anti-age-complet" },
  { group: "Éclat & Anti-Taches", std: "pack-eclat-anti-taches-standard", full: "pack-eclat-anti-taches-complet" },
  { group: "Peau Mixte", std: "pack-peau-mixte-standard", full: "pack-peau-mixte-complet" },
  { group: "Découverte K-Beauty", std: "pack-decouverte-standard", full: "pack-decouverte-complet" },
];

const TYPES = [
  
  { label: "Nettoyant", href: "/catalogue?cat=nettoyant&catLabel=nettoyant" },
  { label: "Toner", href: "/catalogue?cat=toner&catLabel=toner" },
  { label: "Essence", href: "/catalogue?cat=essence&catLabel=essence" },
  { label: "Sérum", href: "/catalogue?cat=serum&catLabel=serum"},
  { label: "Crème", href: "/catalogue?cat=crème&catLabel=crème" },
  { label: "Masque tissu", href: "/catalogue?cat=masque&catLabel=masque" },
  { label: "Crème solaire (SPF)", href: "/catalogue?cat=spf&catLabel=spf" },

];

const HELP = [
  { label: "À propos", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Suivi de commande", href: "/suivi-commande" },
  { label: "FAQ", href: "/faq" },
  { label: "Livraison & retours", href: "/livraison" },
  { label: "Paiement sécurisé", href: "/paiement-securise" },
  { label: "CGV / CGU", href: "/cgv" },
  { label: "Confidentialité & cookies", href: "/confidentialite" },
  { label: "Mentions légales", href: "/mentions-legales" },
  { label: "Sitemap", href: "/sitemap" },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* Brand */}
        <div className="col brand">
          <div className="brand-box">
            <div className="logo">KORELIA</div>
            <p className="tagline">Parce que chaque peau mérite d’être aimée.</p>
            <div className="contact">
              <a className="contact-link" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
              <a className="contact-link" href={`https://wa.me/${WHATSAPP_E164.replace(/\D/g,"")}`} target="_blank" rel="noreferrer">
                WhatsApp : {WHATSAPP_E164}
              </a>
            </div>
            <div className="social" aria-label="Réseaux sociaux">
              <a href="https://instagram.com" className="ico" aria-label="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6"/>
                  <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6"/>
                  <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/>
                </svg>
              </a>
              <a href="https://tiktok.com" className="ico" aria-label="TikTok">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M14 4v8.5a3.5 3.5 0 1 1-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 6c1.6 2 3.7 3 6 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </a>
              <a href="https://youtube.com" className="ico" aria-label="YouTube">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="6" width="18" height="12" rx="3" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M11 9.5v5l4-2.5-4-2.5z" fill="currentColor"/>
                </svg>
              </a>
              <a href="https://pinterest.com" className="ico" aria-label="Pinterest">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M10.8 16.5c.4-1.6.6-2.6.9-4.1-.2-.3-.3-.8-.3-1.2 0-1.3 1-2.3 2.4-2.3 1.2 0 2.1.8 2.1 2.1 0 2.1-1.1 3.8-3.1 3.8-.6 0-1.1-.2-1.4-.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Packs condensés */}
        <nav className="col packs" aria-label="Packs routines">
          <h3>Packs Routines</h3>
          <ul className="packs-list">
            {PACK_GROUPS.map(g=>(
              <li key={g.group} className="packs-item">
                <span className="packs-group">{g.group}</span>
                <span className="packs-links">
                  <a href={`/pack/${g.std}`}>Standard</a>
                  <span>·</span>
                  <a href={`/pack/${g.full}`}>Complet</a>
                </span>
              </li>
            ))}
          </ul>
          <a className="packs-all" href="/catalogue?cat=pack&catLabel=pack">Voir tous les packs →</a>
        </nav>

        {/* Produits par type */}
        <nav className="col products" aria-label="Produits par type">
          <h3>Produits</h3>
          <ul>
            {TYPES.map((t) => (
              <li key={t.href}><a href={t.href}>{t.label}</a></li>
            ))}
          </ul>
        </nav>

        {/* Service client */}
        <nav className="col help" aria-label="Service client">
          <h3>Service client</h3>
          <ul>
            {HELP.map((h) => (
              <li key={h.href}><a href={h.href}>{h.label}</a></li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="legal">
        <p>© {new Date().getFullYear()} Korelia. Tous droits réservés.</p>
        <div className="legal-links">
          <a href="/confidentialite">Confidentialité - Cookies</a><span>·</span>
          
          <a href="/mentions-legales">Mentions légales</a><span>·</span>
          <a href="/sitemap">Sitemap</a>
        </div>
      </div>
    </footer>
  );
}
