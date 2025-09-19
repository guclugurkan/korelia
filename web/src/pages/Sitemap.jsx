import React from "react";
import "./Sitemap.css";

const routes = {
  "Accueil": [ { label: "Accueil", href: "/" } ],
  "Catalogue": [
    { label: "Tous les produits", href: "/catalogue" },
    { label: "Par marque", href: "/brands" },
    { label: "Par type (catégories)", href: "/#types" }
  ],
  "Packs": [
    { label: "Tous les packs", href: "/packs" },
    { label: "Peau Sèche – Standard", href: "/packs/pack-peau-seche-budget" },
    { label: "Peau Sèche – Complet", href: "/packs/pack-peau-seche-complet" },
    { label: "Peau Grasse & Acnéique – Standard", href: "/packs/pack-peau-grasse-acneique-standard" },
    { label: "Peau Grasse & Acnéique – Complet", href: "/packs/pack-peau-grasse-acneique-complet" },
    { label: "Peau Sensible – Standard", href: "/packs/pack-peau-sensible-standard" },
    { label: "Peau Sensible – Complet", href: "/packs/pack-peau-sensible-complet" },
    { label: "Anti-Âge – Standard", href: "/packs/pack-anti-age-standard" },
    { label: "Anti-Âge – Complet", href: "/packs/pack-anti-age-complet" },
    { label: "Éclat & Anti-Taches – Standard", href: "/packs/pack-eclat-anti-taches-standard" },
    { label: "Éclat & Anti-Taches – Complet", href: "/packs/pack-eclat-anti-taches-complet" },
    { label: "Peau Mixte – Standard", href: "/packs/pack-peau-mixte-standard" },
    { label: "Peau Mixte – Complet", href: "/packs/pack-peau-mixte-complet" },
    { label: "Découverte – Standard", href: "/packs/pack-decouverte-standard" },
    { label: "Découverte – Complet", href: "/packs/pack-decouverte-complet" },
  ],
  "Infos": [
    { label: "À propos / Notre histoire", href: "/a-propos" },
    { label: "Contact", href: "/contact" },
    { label: "Suivi de commande", href: "/suivi-commande" },
    { label: "FAQ", href: "/faq" },
    { label: "Livraison & retours", href: "/livraison-retours" },
    { label: "Paiement sécurisé", href: "/paiement-securise" },
    { label: "CGV / CGU", href: "/cgv" },
    { label: "Confidentialité & cookies", href: "/confidentialite" },
    { label: "Mentions légales", href: "/mentions-legales" }
  ]
};

export default function Sitemap() {
  return (
    <main className="sitemap-page">
      <header className="sitemap-hero">
        <h1>Sitemap (plan du site)</h1>
        <p>Explore la structure du site et accède rapidement aux sections importantes.</p>
      </header>

      <section className="sitemap-grid">
        {Object.entries(routes).map(([group, links])=>(
          <article key={group} className="sitemap-card">
            <h2>{group}</h2>
            <ul>
              {links.map(l=>(
                <li key={l.href}><a href={l.href}>{l.label}</a></li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </main>
  );
}
